# AIGenNFT2

**AIGenNFT2** is a decentralized application (dApp) for minting, managing, and reselling non-fungible tokens (NFTs) on the Ethereum blockchain. It allows users to create NFTs from image URLs or AI-generated images (via Replicate API), store metadata and images on IPFS using Pinata, and query NFT details on-chain or locally. The project is built with Hardhat for smart contract development and interaction.

## Features

- **Mint NFTs from URLs**: Mint NFTs using images from provided URLs (jpg, png, gif).
- **Mint NFTs from AI Prompts**: Generate images with AI via Replicate and mint them as NFTs.
- **NFT Lookup**: Query NFTs by token ID (on-chain) or search metadata by user ID, name, or transaction hash.
- **IPFS Storage**: Store images and metadata on IPFS using Pinata.
- **NFT Resale**: Transfer NFT ownership with royalty support.
- **Hardhat Integration**: Deploy and manage the `AIGenNFT` smart contract.

## Prerequisites

- **Node.js**: Version 16 or higher
- **Hardhat**: Ethereum development environment
- **Pinata Account**: For IPFS storage ([get API key/secret](https://www.pinata.cloud/))
- **Replicate Account**: For AI image generation ([get API token](https://replicate.com/))
- **MetaMask or Wallet**: For Ethereum transactions
- **Ethereum Testnet**: Recommended for testing (e.g., Sepolia)

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/vietnamchxhcn/AIGenNFT2.git
   cd AIGenNFT2
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   REPLICATE_API_TOKEN=your_replicate_api_token
   PINATA_API_KEY=your_pinata_api_key
   PINATA_API_SECRET=your_pinata_api_secret
   PRIVATE_KEY=your_wallet_private_key
   ```

4. **Compile Smart Contracts**:
   ```bash
   npx hardhat compile
   ```

## Usage

### Deploy the Smart Contract

Deploy the `AIGenNFT` contract to your chosen network:
```bash
npx hardhat run scripts/deploy.js --network <network>
```
Replace `<network>` with `sepolia`, `localhost`, or another configured network. The contract address will be saved to `contract-address.json`.

### Mint or Lookup NFTs

Run the main script to mint or query NFTs:
```bash
npx hardhat run scripts/main.js
```

**Options**:
1. **Mint from URL**: Provide a valid image URL to mint an NFT.
2. **Mint from AI Prompt**: Enter an AI prompt to generate and mint an NFT.
3. **Lookup NFT**: Query by:
   - Token ID (on-chain)
   - Token ID, user ID, name, or mint transaction hash (local metadata in `all-metadata.json`)

**Process**:
- Select an account (from `node_output.txt` or Hardhat default accounts).
- Upload images/metadata to IPFS via Pinata.
- Mint NFTs and save metadata to `all-metadata.json`.
- Temporary files are cleaned up automatically.

### Resale NFTs

Run the resale script to transfer NFT ownership:
```bash
npx hardhat run scripts/resale.js
```

**Steps**:
1. Select an NFT from `all-metadata.json` by index.
2. Enter a minimum sale price (in ETH, default: 1 ETH).
3. Transfer ownership to the buyer with royalty payments.

## File Structure

- `contracts/AIGenNFT.sol`: NFT smart contract
- `scripts/main.js`: Minting and lookup script
- `scripts/resale.js`: NFT resale script
- `contract-address.json`: Deployed contract address
- `all-metadata.json`: Metadata for all minted NFTs
- `node_output.txt`: Optional file for account addresses/private keys

## Smart Contract

- **Name**: `AIGenNFT`
- **Standard**: ERC-721 with royalty support
- **Key Functions**:
  - Mint NFTs with IPFS-hosted metadata
  - Resale with royalty distribution
  - Pause/unpause contract
- **Events**:
  - `Minted`: Triggered on NFT creation
  - `Resold`: Triggered on NFT resale
  - `Transfer`: Standard ERC-721 transfer

## Dependencies

- `hardhat`: Ethereum development framework
- `ethers`: Ethereum JavaScript library
- `axios`: HTTP requests for Replicate/Pinata
- `form-data`: File uploads to Pinata
- `dotenv`: Environment variable management
- `readline`: Command-line user input

## Example Workflow

1. **Mint an NFT**:
   - Run `main.js`, select option 1 (URL) or 2 (AI prompt).
   - Provide image URL or AI prompt, NFT name, and description.
   - Image and metadata are uploaded to IPFS, and the NFT is minted.

2. **Resale an NFT**:
   - Run `resale.js`, select an NFT by index.
   - Enter sale price (e.g., 1 ETH).
   - NFT is transferred with royalties paid.

3. **Lookup an NFT**:
   - Run `main.js`, select option 3.
   - Query by token ID (on-chain) or metadata fields (local).

## Notes

- **Security**: Never commit `.env` or private keys to GitHub. Ensure `.env` is in `.gitignore`.
- **Testing**: Use a testnet (e.g., Sepolia) to avoid real ETH costs.
- **Error Handling**: Scripts handle invalid inputs, paused contracts, and transaction failures.
- **AI Generation**: Verify Replicate API token has sufficient credits.

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgments

- [Hardhat](https://hardhat.org/) for blockchain development
- [Pinata](https://www.pinata.cloud/) for IPFS storage
- [Replicate](https://replicate.com/) for AI image generation
- Vietnam's blockchain and AI communities for inspiration
