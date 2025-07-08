const fs = require("fs");
const { ethers } = require("hardhat");
const axios = require("axios");
const FormData = require("form-data");
const readline = require("readline");
require("dotenv").config({ quiet: true });

// Utility: Create readline interface for user input
const getInput = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

// Utility: Load accounts from node_output.txt
const loadAccountsFromFile = () => {
  try {
    const lines = fs.readFileSync("./node_output.txt", "utf8").split("\n");
    const accounts = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("Account #")) {
        const address = lines[i].split(":")[1]?.trim();
        const privateKey = lines[i + 1]?.startsWith("Private Key:") 
          ? lines[i + 1].split(":")[1].trim().split("-")[1]?.trim() || lines[i + 1].split(":")[1].trim()
          : null;
        if (address && privateKey) accounts.push({ address, privateKey });
      }
    }
    if (!accounts.length) {
      console.log("No accounts found in node_output.txt. Using default Hardhat accounts.");
      return [];
    }
    console.log("Accounts found:", accounts.map((acc, i) => `${i}: ${acc.address}`).join("\n"));
    return accounts;
  } catch (error) {
    console.error("Error reading node_output.txt:", error.message);
    return [];
  }
};

// Utility: Select account and update .env
const selectAccount = async (accounts) => {
  const idx = parseInt(await getInput(`Enter account index (0 - ${accounts.length - 1}, -1 for default): `));
  if (isNaN(idx) || idx >= accounts.length) {
    console.log("Invalid selection. Using default account.");
    return null;
  }
  if (idx >= 0) {
    const privateKey = accounts[idx].privateKey;
    let env = fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "";
    env = env.replace(/PRIVATE_KEY=.*/g, `PRIVATE_KEY=${privateKey}`) || env + `\nPRIVATE_KEY=${privateKey}`;
    fs.writeFileSync(".env", env);
    console.log(`Selected account: ${accounts[idx].address}`);
    return privateKey;
  }
  return null;
};

// Utility: Validate image URL
const isValidImageUrl = async (url) => {
  try {
    const response = await axios.head(url, { timeout: 5000 });
    return response.headers["content-type"]?.startsWith("image/");
  } catch {
    return false;
  }
};

// Utility: Download image from URL
const downloadImage = async (url, outputPath) => {
  console.log(`Downloading image from: ${url}`);
  const response = await axios.get(url, { responseType: "stream" });
  if (!response.headers["content-type"]?.startsWith("image/")) {
    throw new Error(`Invalid image URL. MIME: ${response.headers["content-type"] || "unknown"}`);
  }
  const ext = response.headers["content-type"].split("/")[1].split(";")[0].replace("jpeg", "jpg");
  const finalPath = `${outputPath}.${ext}`;
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(finalPath);
    response.data.pipe(writer);
    writer.on("finish", () => resolve(finalPath));
    writer.on("error", (err) => {
      fs.unlink(finalPath, () => reject(err));
    });
  });
};

// Utility: Generate image from AI prompt
const generateImageFromPrompt = async (prompt, outputPath) => {
  const modelVersion = "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc";
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN not defined in .env");

  console.log(`Generating image with prompt: ${prompt}`);
  const res = await axios.post(
    "https://api.replicate.com/v1/predictions",
    { version: modelVersion, input: { prompt } },
    { headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" } }
  );

  const getUrl = res.data.urls.get;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const outRes = await axios.get(getUrl, { headers: { Authorization: `Token ${token}` } });
    if (outRes.data.status === "succeeded") {
      const img = await axios.get(outRes.data.output[0], { responseType: "arraybuffer" });
      const finalPath = `${outputPath}.png`;
      fs.writeFileSync(finalPath, img.data);
      console.log(`Image saved: ${finalPath}`);
      return finalPath;
    }
    if (outRes.data.status === "failed") throw new Error("Replicate job failed");
  }
  throw new Error("Replicate generation timed out");
};

// Utility: Upload file to Pinata
const uploadToPinata = async (filePath) => {
  const { PINATA_API_KEY, PINATA_API_SECRET } = process.env;
  if (!PINATA_API_KEY || !PINATA_API_SECRET) throw new Error("Pinata API credentials missing");

  console.log(`Uploading to Pinata: ${filePath}`);
  const data = new FormData();
  data.append("file", fs.createReadStream(filePath));
  const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", data, {
    maxBodyLength: Infinity,
    headers: { pinata_api_key: PINATA_API_KEY, pinata_secret_api_key: PINATA_API_SECRET, ...data.getHeaders() },
  });
  console.log(`IPFS Hash: ${res.data.IpfsHash}`);
  return res.data.IpfsHash;
};

// Utility: Mint NFT
const mintNFT = async (nft, metadataUrl, wallet) => {
  if (await nft.paused()) throw new Error("Contract is paused");
  console.log(`Minting NFT with metadata: ${metadataUrl}`);
  const tx = await nft.connect(wallet).mint(metadataUrl, { gasLimit: 300000 });
  console.log(`Transaction sent: ${tx.hash}`);
  const receipt = await tx.wait();
  
  let tokenId;
  for (const log of receipt.logs) {
    try {
      const parsed = nft.interface.parseLog(log);
      if (parsed.name === "Transfer" || parsed.name === "Minted") {
        tokenId = parsed.args.tokenId.toString();
        break;
      }
    } catch {}
  }
  if (!tokenId) {
    const nextId = await nft.nextTokenId();
    tokenId = (BigInt(nextId) - BigInt(1)).toString();
    console.log(`Estimated tokenId: ${tokenId}`);
  }
  return { txHash: tx.hash, tokenId };
};

// Utility: Save metadata
const saveMetadata = (metadata, mintTxHash, metadataHash, tokenId) => {
  const metaObj = { ...metadata, token_uri: `https://gateway.pinata.cloud/ipfs/${metadataHash}`, ipfs_hash: metadataHash, mint_tx_hash: mintTxHash, token_id: tokenId };
  const all = fs.existsSync("./all-metadata.json") ? JSON.parse(fs.readFileSync("./all-metadata.json")) : [];
  all.push(metaObj);
  fs.writeFileSync("./all-metadata.json", JSON.stringify(all, null, 2));
  console.log("Metadata saved:", metaObj);
};

// Function 1: Mint NFT from URL
const mintFromUrl = async (nft, wallet) => {
  let url;
  while (true) {
    url = await getInput("Enter NFT image URL (jpg, png, gif): ");
    if (!/^https?:\/\//i.test(url)) {
      console.log("URL must start with http:// or https://");
      continue;
    }
    if (!(await isValidImageUrl(url))) {
      console.log("Invalid image URL. Try again.");
      continue;
    }
    break;
  }
  const tempFile = await downloadImage(url, "./tmp_image");
  try {
    const name = await getInput("Enter NFT name: ") || "NFT from URL";
    const description = await getInput("Enter NFT description: ") || "URL-based NFT";
    const prompt = await getInput("Enter original AI prompt (skip if none): ") || "";
    
    const imageHash = await uploadToPinata(tempFile);
    const metadata = { name, description, image: `https://gateway.pinata.cloud/ipfs/${imageHash}`, prompt, user_id: wallet.address, created_at: new Date().toISOString() };
    fs.writeFileSync("./metadata.json", JSON.stringify(metadata, null, 2));
    
    const metadataHash = await uploadToPinata("./metadata.json");
    const { txHash, tokenId } = await mintNFT(nft, `https://gateway.pinata.cloud/ipfs/${metadataHash}`, wallet);
    saveMetadata(metadata, txHash, metadataHash, tokenId);
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    if (fs.existsSync("./metadata.json")) fs.unlinkSync("./metadata.json");
  }
};

// Function 2: Mint NFT from AI prompt
const mintFromAIPrompt = async (nft, wallet) => {
  const prompt = await getInput("Enter AI image prompt: ");
  if (!prompt) throw new Error("Prompt cannot be empty");
  const tempFile = await generateImageFromPrompt(prompt, "./ai_generated_image");
  try {
    const name = await getInput("Enter NFT name: ") || "AI-generated NFT";
    const description = await getInput("Enter NFT description: ") || "AI-generated NFT";
    const confirmedPrompt = await getInput("Confirm AI prompt: ") || prompt;
    
    const imageHash = await uploadToPinata(tempFile);
    const metadata = { name, description, image: `https://gateway.pinata.cloud/ipfs/${imageHash}`, prompt: confirmedPrompt, user_id: wallet.address, created_at: new Date().toISOString() };
    fs.writeFileSync("./metadata.json", JSON.stringify(metadata, null, 2));
    
    const metadataHash = await uploadToPinata("./metadata.json");
    const { txHash, tokenId } = await mintNFT(nft, `https://gateway.pinata.cloud/ipfs/${metadataHash}`, wallet);
    saveMetadata(metadata, txHash, metadataHash, tokenId);
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    if (fs.existsSync("./metadata.json")) fs.unlinkSync("./metadata.json");
  }
};

// Function 3: Lookup NFT
const lookupNFT = async (contractAddress) => {
  const type = await getInput("Lookup by: 1. TokenId (blockchain), 2. TokenId (local), 3. UserId, 4. Name, 5. MintTxHash: ");
  if (type === "1") {
    const tokenId = await getInput("Enter tokenId: ");
    if (isNaN(tokenId)) throw new Error("Invalid tokenId");
    const AIGenNFT = await ethers.getContractFactory("AIGenNFT");
    const nft = AIGenNFT.attach(contractAddress);
    const owner = await nft.ownerOf(tokenId);
    const tokenURI = await nft.tokenURI(tokenId);
    const metadata = (await axios.get(tokenURI)).data;
    console.log(`NFT Info (TokenId: ${tokenId})`, { owner, tokenURI, ...metadata });
  } else {
    const searchParams = {};
    if (type === "2") searchParams.tokenId = await getInput("Enter tokenId: ");
    else if (type === "3") searchParams.userId = await getInput("Enter user_id: ");
    else if (type === "4") searchParams.name = await getInput("Enter name: ");
    else if (type === "5") searchParams.mintTxHash = await getInput("Enter mint_tx_hash: ");
    else throw new Error("Invalid lookup type");

    if (!fs.existsSync("./all-metadata.json")) {
      console.log("all Gracie.json not found");
      return;
    }
    const all = JSON.parse(fs.readFileSync("./all-metadata.json"));
    const results = all.filter((item) =>
      Object.entries(searchParams).every(([key, value]) =>
        item[key] && String(item[key]).toLowerCase().includes(value.toLowerCase())
      )
    );
    if (!results.length) {
      console.log("No matching NFTs found");
      return;
    }
    results.forEach((meta, i) => {
      console.log(`NFT #${i + 1} (tokenId: ${meta.token_id || "?"})`, meta);
   Energies);
  }
};

// Main function
async function main() {
  // Validate environment variables
  if (!process.env.REPLICATE_API_TOKEN || !process.env.PINATA_API_KEY || !process.env.PINATA_API_SECRET) {
    throw new Error("Missing required environment variables");
  }

  // Load and select wallet
  const accounts = loadAccountsFromFile();
  const privateKey = await selectAccount(accounts);
  const [defaultSigner] = await ethers.getSigners();
  const wallet = privateKey ? new ethers.Wallet(privateKey, ethers.provider) : defaultSigner;
  console.log(`Using wallet: ${wallet.address}`);

  // Load and verify contract
  const addressJson = JSON.parse(fs.readFileSync("./contract-address.json"));
  const contractAddress = addressJson.address;
  if (!ethers.isAddress(contractAddress)) throw new Error("Invalid contract address");

  const AIGenNFT = await ethers.getContractFactory("AIGenNFT");
  const nft = AIGenNFT.attach(contractAddress);
  
  // Sync nextTokenId
  let initialTokenId = 0;
  if (fs.existsSync("./all-metadata.json")) {
    const all = JSON.parse(fs.readFileSync("./all-metadata.json"));
    initialTokenId = Math.max(...all.map((item) => item.token_id || 0)) + 1;
  }
  const currentNextId = await nft.nextTokenId();
  if (currentNextId < initialTokenId) {
    await (await nft.setNextTokenId(initialTokenId)).wait();
    console.log(`nextTokenId updated to ${initialTokenId}`);
  }

  // User choice
  const choice = await getInput("Choose: 1. Mint from URL, 2. Mint from AI prompt, 3. Lookup NFT: ");
  if (choice === "1") await mintFromUrl(nft, wallet);
  else if (choice === "2") await mintFromAIPrompt(nft, wallet);
  else if (choice === "3") await lookupNFT(contractAddress);
  else throw new Error("Invalid choice");
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});