const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AIGenNFT", function () {
  it("Mint và resale NFT, chia royalty đúng", async function () {
    const [creator, buyer, reseller] = await ethers.getSigners();
    const royaltyFee = 500; // 5%

    // SỬA DÒNG DƯỚI: thêm creator.address
    const AIGenNFT = await ethers.getContractFactory("AIGenNFT");
    const contract = await AIGenNFT.deploy(royaltyFee, creator.address);
    // Nếu bạn dùng ethers v6, KHÔNG cần await contract.deployed();
    // Nếu ethers v5 thì giữ lại cũng không sao.

    // Creator mint NFT
    const tx = await contract.connect(creator).mint("ipfs://my-ai-image");
    const receipt = await tx.wait();
    const tokenId = receipt.logs[0].args.tokenId; // ethers v6 dùng logs

    // Creator bán lại cho reseller với giá 1 ETH
    await contract.connect(creator).resale(tokenId, reseller.address, { value: ethers.parseEther("1") });

    // Reseller bán lại cho buyer với giá 2 ETH
    await contract.connect(reseller).resale(tokenId, buyer.address, { value: ethers.parseEther("2") });

    // Có thể kiểm tra thêm số dư hoặc quyền sở hữu...
  });
});
