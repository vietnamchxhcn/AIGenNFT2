// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AIGenNFT is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;
    mapping(uint256 => address) public creators;
    uint96 public royaltyFee; // (500 = 5%)

    event Minted(uint256 tokenId, address creator, string tokenURI);

    constructor(uint96 _royaltyFee, address initialOwner)
        ERC721("AI Image NFT", "AINFT")
        Ownable(initialOwner)
    {
        royaltyFee = _royaltyFee;
    }

    function mint(string memory _tokenURI) external returns (uint256) {
        uint256 tokenId = nextTokenId;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        creators[tokenId] = msg.sender;
        nextTokenId++;
        emit Minted(tokenId, msg.sender, _tokenURI);
        return tokenId;
    }

    function resale(uint256 tokenId, address buyer) external payable {
        address seller = ownerOf(tokenId);
        require(seller == msg.sender, "You are not the owner");
        require(buyer != address(0), "Invalid buyer");
        require(msg.value > 0, "No payment sent");

        uint256 royalty = (msg.value * royaltyFee) / 10000;
        uint256 paymentToSeller = msg.value - royalty;

        // Trả tiền bản quyền cho creator gốc
        payable(creators[tokenId]).transfer(royalty);
        // Trả phần còn lại cho người bán
        payable(seller).transfer(paymentToSeller);

        // Chuyển quyền sở hữu NFT cho người mua
        _transfer(seller, buyer, tokenId);
    }

    // Admin có thể thay đổi royalty fee
    function setRoyaltyFee(uint96 _fee) external onlyOwner {
        royaltyFee = _fee;
    }
}
