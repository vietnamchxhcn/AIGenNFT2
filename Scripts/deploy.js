const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  let initialTokenId = 0;
  if (fs.existsSync("./all-metadata.json")) {
    const all = JSON.parse(fs.readFileSync("./all-metadata.json", "utf8"));
    if (all.length > 0) {
      initialTokenId = Math.max(...all.map((item) => item.token_id || 0)) + 1;
    }
  }
  console.log("Deploying with initial token ID:", initialTokenId);

  const AIGenNFT = await ethers.getContractFactory("AIGenNFT");
  const contract = await AIGenNFT.deploy(500, deployer.address, initialTokenId); // 5% royalty
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("AIGenNFT deployed to:", contractAddress);

  fs.writeFileSync(
    "./contract-address.json",
    JSON.stringify({ address: contractAddress }, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});