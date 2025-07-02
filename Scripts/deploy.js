const fs = require("fs");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const royaltyFee = 500;
  const AIGenNFT = await ethers.getContractFactory("AIGenNFT");
  const contract = await AIGenNFT.deploy(royaltyFee, deployer.address);
  const address = contract.target || contract.address; // target cho ethers v6, address cho ethers v5

  console.log("Deployed AIGenNFT to:", address);

  // Ghi contract address ra file (KHÔNG ĐỌC file này ở đầu script!)
  fs.writeFileSync(
    "./contract-address.json",
    JSON.stringify({ address }, null, 2)
  );
}

main().catch(console.error);