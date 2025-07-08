AIGenNFT2
AIGenNFT2 is a decentralized application (dApp) for minting and managing non-fungible tokens (NFTs) on the Ethereum blockchain. It supports minting NFTs from user-provided image URLs or AI-generated images (via Replicate API) and stores metadata and images on IPFS using Pinata. The project also includes functionality to look up NFT details on-chain and locally via metadata.

Features
Mint NFTs from URLs: Upload images from a provided URL and mint them as NFTs.
Mint NFTs from AI Prompts: Generate images using AI (Replicate API) and mint them as NFTs.
NFT Lookup: Query NFT details by token ID (on-chain) or search metadata locally by user ID, name, or transaction hash.
IPFS Storage: Store images and metadata on IPFS via Pinata for decentralized storage.
Resale Functionality: Transfer NFT ownership with royalty support.
Hardhat Integration: Deploy and interact with the AIGenNFT smart contract using Hardhat.
Prerequisites
Node.js (v16 or higher)
Hardhat: Ethereum development environment
Pinata Account: For IPFS storage (API key and secret required)
Replicate Account: For AI image generation (API token required)
MetaMask or Wallet: For Ethereum transactions
Ethereum Testnet: Recommended for testing (e.g., Sepolia)
Installation
Clone the Repository:
bash

Thu gọn

Bọc lại

Chạy

Sao chép
git clone https://github.com/vietnamchxhcn/AIGenNFT2.git
cd AIGenNFT2
Install Dependencies:
bash

Thu gọn

Bọc lại

Chạy

Sao chép
npm install
Set Up Environment Variables: Create a .env file in the project root and add the following:
env

Thu gọn

Bọc lại

Sao chép
REPLICATE_API_TOKEN=your_replicate_api_token
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_api_secret
PRIVATE_KEY=your_wallet_private_key
Compile Smart Contracts:
bash

Thu gọn

Bọc lại

Chạy

Sao chép
npx hardhat compile
Usage
Deploy the Smart Contract
Deploy the AIGenNFT contract:
bash

Thu gọn

Bọc lại

Chạy

Sao chép
npx hardhat run scripts/deploy.js --network <network>
Replace <network> with your target network (e.g., sepolia, localhost).
The contract address will be saved to contract-address.json.
Mint NFTs
Run the main script to mint or lookup NFTs:

bash

Thu gọn

Bọc lại

Chạy

Sao chép
npx hardhat run scripts/main.js
Options:

Mint from URL: Provide an image URL (jpg, png, gif) to mint as an NFT.
Mint from AI Prompt: Enter a prompt to generate an AI image via Replicate and mint it.
Lookup NFT: Query NFT details by:
Token ID (on-chain)
Token ID, user ID, name, or mint transaction hash (local metadata)
The script will:

Prompt for account selection (from node_output.txt or default Hardhat accounts).
Upload images and metadata to Pinata (IPFS).
Mint NFTs and store metadata in all-metadata.json.
Clean up temporary files after execution.
Resale NFTs
Run the resale script to transfer NFT ownership:

bash

Thu gọn

Bọc lại

Chạy

Sao chép
npx hardhat run scripts/resale.js
Steps:

Select an NFT from all-metadata.json by index.
Specify a minimum sale price (in ETH).
Execute the resale, transferring ownership to the buyer with royalty payments.
File Structure
contracts/AIGenNFT.sol: The NFT smart contract.
scripts/main.js: Handles minting and lookup functionality.
scripts/resale.js: Handles NFT resale.
contract-address.json: Stores the deployed contract address.
all-metadata.json: Stores metadata for all minted NFTs.
node_output.txt: Optional file for account addresses and private keys.
Smart Contract Details
Contract Name: AIGenNFT
Features:
ERC-721 compliant NFT with royalty support.
Minting with metadata stored on IPFS.
Resale functionality with royalty distribution.
Pausable contract for administrative control.
Events:
Minted: Emitted when an NFT is minted.
Resold: Emitted when an NFT is resold.
Transfer: Standard ERC-721 transfer event.
Dependencies
hardhat: Ethereum development framework.
ethers: Ethereum JavaScript library.
axios: For HTTP requests (Replicate, Pinata).
form-data: For file uploads to Pinata.
dotenv: For environment variable management.
readline: For command-line user input.
Example Workflow
Mint an NFT:
Run main.js.
Choose option 1 (URL) or 2 (AI prompt).
Enter image URL or AI prompt, NFT name, and description.
The image and metadata are uploaded to IPFS, and the NFT is minted.
Resale an NFT:
Run resale.js.
Select an NFT by index.
Enter a sale price (e.g., 1 ETH).
The NFT is transferred to the buyer, with royalties paid to the creator.
Lookup an NFT:
Run main.js and choose option 3.
Query by token ID (on-chain) or metadata fields (local).
Notes
Security: Never commit your .env file or private keys to version control.
Testing: Use a testnet (e.g., Sepolia) to avoid real ETH costs during development.
Error Handling: The scripts include robust error handling for invalid inputs, paused contracts, and failed transactions.
AI Generation: Ensure your Replicate API token has sufficient credits for image generation.
Contributing
Contributions are welcome! Please:

Fork the repository.
Create a feature branch (git checkout -b feature/your-feature).
Commit your changes (git commit -m "Add your feature").
Push to the branch (git push origin feature/your-feature).
Open a pull request.
License
This project is licensed under the MIT License. See the LICENSE file for details.

Acknowledgments
Built with Hardhat.
Image and metadata storage via Pinata.
AI image generation via Replicate.
Inspired by the vibrant blockchain and AI communities in Vietnam.
This README provides a clear overview of the project, its setup, and usage instructions, tailored for both technical and non-technical users. It aligns with the functionality of the provided scripts (main.js and resale.js) and includes best practices for open-source projects. If you need specific additions (e.g., badges, screenshots, or more detailed contract info), let me know!
