const { ethers } = require("hardhat");
const fs = require("fs");
const readline = require("readline");

// Utility: Ask question via readline
const askQuestion = (query) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });

// Main function
async function main() {
  // Get signers
  const [deployer, buyer] = await ethers.getSigners();
  console.log(`📦 Deployer: ${deployer.address}\n🧍 Buyer: ${buyer.address}`);

  // Load contract address
  let contractAddress;
  try {
    contractAddress = JSON.parse(fs.readFileSync("./contract-address.json")).address;
    if (!ethers.isAddress(contractAddress)) throw new Error("Invalid contract address");
  } catch (error) {
    console.error("❌ Error reading contract-address.json:", error.message);
    return;
  }

  // Attach to AIGenNFT contract
  const AIGenNFT = await ethers.getContractFactory("AIGenNFT");
  const contract = AIGenNFT.attach(contractAddress);

  // Verify contract name
  const name = await contract.name();
  if (name !== "AI Image NFT") {
    console.error("❌ Contract is not AIGenNFT");
    return;
  }
  console.log(`✅ Contract: ${name}`);

  // Check if contract is paused
  if (await contract.paused()) {
    console.error("❌ Contract is paused");
    return;
  }
  console.log("🔒 Contract: Active");

  // Load and display NFTs from metadata
  let metadata;
  try {
    metadata = JSON.parse(fs.readFileSync("./all-metadata.json")).filter((nft) => nft.token_id);
    if (!metadata.length) throw new Error("No NFTs found in all-metadata.json");
  } catch (error) {
    console.error("❌ Error reading all-metadata.json:", error.message);
    return;
  }

  console.log("\n📄 Available NFTs:");
  metadata.forEach((nft, i) =>
    console.log(`${i + 1}. 🖼️ Token ID: ${nft.token_id}\n   📛 Name: ${nft.name}\n   📝 Description: ${nft.description}`)
  );

  // Select NFT
  const selectedIndex = parseInt(await askQuestion("🔢 Enter NFT index: ")) - 1;
  if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= metadata.length) {
    console.error("❌ Invalid selection");
    return;
  }

  const selectedNFT = metadata[selectedIndex];
  const tokenId = BigInt(selectedNFT.token_id);
  console.log(`\n🔍 Processing NFT: Token ID ${tokenId} - ${selectedNFT.name}`);

  // Verify token and owner
  let owner;
  try {
    owner = await contract.ownerOf(tokenId);
    console.log(`👤 Owner: ${owner}`);
  } catch (error) {
    console.error(`❌ Token ID ${tokenId} does not exist:`, error.message);
    return;
  }

  // Check if deployer is owner
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.error(`❌ Deployer is not the owner of Token ID ${tokenId}`);
    return;
  }

  // Get royalty info
  const salePrice = ethers.parseEther("1");
  const [royaltyReceiver, royaltyAmount] = await contract.royaltyInfo(tokenId, salePrice);
  console.log(`💸 Royalty: ${ethers.formatEther(royaltyAmount)} ETH to ${royaltyReceiver}`);

  // Prompt for minimum sale price
  const minSalePrice = ethers.parseEther(
    await askQuestion("💰 Enter minimum sale price (ETH, default 1): ") || "1"
  );
  console.log(`💰 Simulating sale to ${buyer.address} for ${ethers.formatEther(minSalePrice)} ETH`);

  // Execute resale
  try {
    const tx = await contract.connect(deployer).resale(tokenId, buyer.address, minSalePrice, {
      value: minSalePrice,
      gasLimit: 300000,
    });
    console.log("📤 Transaction hash:", tx.hash);
    const receipt = await tx.wait();

    // Verify new owner
    const newOwner = await contract.ownerOf(tokenId);
    console.log(`✅ Ownership transferred to ${newOwner}`);

    // Log Resold event
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed.name === "Resold") {
          console.log(
            `📊 Resold: Token ID ${parsed.args.tokenId}, Seller: ${parsed.args.seller}, Buyer: ${
              parsed.args.buyer
            }, Price: ${ethers.formatEther(parsed.args.price)} ETH, Royalty: ${ethers.formatEther(
              parsed.args.royalty
            )} ETH`
          );
          break;
        }
      } catch {}
    }
  } catch (error) {
    console.error("❌ Error during resale:", error.message);
  }
}

main().catch((error) => console.error("❌ Error:", error.message));