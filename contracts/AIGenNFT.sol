// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract AIGenNFT is ERC721URIStorage, Ownable, ReentrancyGuard, IERC2981 {
    uint256 public nextTokenId;
    mapping(uint256 => address) public creators;
    uint96 public royaltyFee; // Stored as basis points (500 = 5%)
    uint256 public constant MAX_ROYALTY_FEE = 1000; // 10% maximum royalty
    mapping(uint256 => string) private _tokenURIs; // Explicit storage for token URIs
    mapping(uint256 => uint256) public tokenMintTimestamps; // Track mint time
    mapping(uint256 => string) public prompts; // Store AI prompt
    bool public paused; // Contract pause state

    // Events
    event Minted(
        uint256 indexed tokenId,
        address indexed creator,
        string tokenURI,
        uint256 timestamp,
        bytes32 mintTxHash
    );
    event PromptUpdated(uint256 indexed tokenId, string prompt);
    event Resold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 royalty
    );
    event RoyaltyFeeUpdated(uint96 oldFee, uint96 newFee);
    event ContractPaused(address indexed owner);
    event ContractUnpaused(address indexed owner);
    event NextTokenIdUpdated(uint256 newNextTokenId);

    // Errors
    error ContractIsPaused();
    error InvalidRoyaltyFee();
    error ZeroAddress();
    error InsufficientPayment();
    error NotTokenOwner();
    error InvalidTokenId();
    error EmptyTokenURI();

    constructor(uint96 _royaltyFee, address initialOwner, uint256 initialTokenId)
        ERC721("AI Image NFT", "AINFT")
        Ownable(initialOwner)
    {
        if (_royaltyFee > MAX_ROYALTY_FEE) revert InvalidRoyaltyFee();
        royaltyFee = _royaltyFee;
        paused = false;
        nextTokenId = initialTokenId; // Set initial ID from deployment
    }

    // Modifier to check if contract is not paused
    modifier whenNotPaused() {
        if (paused) revert ContractIsPaused();
        _;
    }

    // Mint function returning tokenId
    function mint(string memory _tokenURI)
        external
        whenNotPaused
        nonReentrant
        returns (uint256)
    {
        if (bytes(_tokenURI).length == 0) revert EmptyTokenURI();

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        creators[tokenId] = msg.sender;
        tokenMintTimestamps[tokenId] = block.timestamp;

        // Generate a pseudo-transaction hash for the event
        bytes32 mintTxHash = keccak256(abi.encodePacked(blockhash(block.number - 1), msg.sender, tokenId));
        emit Minted(tokenId, msg.sender, _tokenURI, block.timestamp, mintTxHash);

        return tokenId;
    }

    // Set prompt for a token after minting
    function setPrompt(uint256 tokenId, string memory _prompt)
        external
        whenNotPaused
    {
        if (_ownerOf(tokenId) == address(0)) revert InvalidTokenId();
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        prompts[tokenId] = _prompt;
        emit PromptUpdated(tokenId, _prompt);
    }

    function resale(uint256 tokenId, address buyer, uint256 minSalePrice)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        if (_ownerOf(tokenId) == address(0)) revert InvalidTokenId();
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (buyer == address(0)) revert ZeroAddress();
        if (msg.value < minSalePrice) revert InsufficientPayment();

        address seller = msg.sender;
        uint256 royalty = (msg.value * royaltyFee) / 10000;
        uint256 paymentToSeller = msg.value - royalty;

        if (royalty > 0 && creators[tokenId] != address(0)) {
            payable(creators[tokenId]).transfer(royalty);
        }

        payable(seller).transfer(paymentToSeller);
        _transfer(seller, buyer, tokenId);

        emit Resold(tokenId, seller, buyer, msg.value, royalty);
    }

    function setRoyaltyFee(uint96 _fee) external onlyOwner {
        if (_fee > MAX_ROYALTY_FEE) revert InvalidRoyaltyFee();
        emit RoyaltyFeeUpdated(royaltyFee, _fee);
        royaltyFee = _fee;
    }

    function pause() external onlyOwner {
        paused = true;
        emit ContractPaused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit ContractUnpaused(msg.sender);
    }

    // New function to update nextTokenId
    function setNextTokenId(uint256 _nextTokenId) external onlyOwner {
        nextTokenId = _nextTokenId;
        emit NextTokenIdUpdated(_nextTokenId);
    }

    // EIP-2981 royalty standard implementation
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        if (_ownerOf(tokenId) == address(0)) revert InvalidTokenId();
        address creator = creators[tokenId];
        uint256 royalty = (salePrice * royaltyFee) / 10000;
        return (creator, royalty);
    }

    function getTokenInfo(uint256 tokenId)
        external
        view
        returns (
            address owner,
            address creator,
            string memory tokenURI,
            string memory prompt,
            uint256 mintTimestamp
        )
    {
        if (_ownerOf(tokenId) == address(0)) revert InvalidTokenId();
        return (
            ownerOf(tokenId),
            creators[tokenId],
            super.tokenURI(tokenId),
            prompts[tokenId],
            tokenMintTimestamps[tokenId]
        );
    }

    // Proper override for supportsInterface
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}