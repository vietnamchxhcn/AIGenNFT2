const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { uploadToPinata, mintNFT } = require('./mint-auto-nft.js');

const upload = multer({ dest: 'uploads/' });
const app = express();

// Add root route
app.get('/', (req, res) => res.send('Welcome to the NFT Minting API!'));

app.get('/health', (req, res) => res.send('Server is healthy!'));

app.post('/mint-nft', upload.single('image'), async (req, res) => {
  console.log('Received request at /mint-nft');
  try {
    const imagePath = req.file.path;
    console.log('Processing image at:', imagePath);

    // 1. Upload ảnh lên Pinata
    const ipfsHash = await uploadToPinata(imagePath);

    // 2. Mint NFT
    const txResult = await mintNFT(ipfsHash);

    // 3. Trả kết quả về cho AI/client
    res.json({
      ipfsHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      txHash: txResult.txHash,
      tokenId: txResult.tokenId,
      contractAddress: txResult.contractAddress,
    });
  } catch (err) {
    console.error('Error processing request:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    // Xóa file ảnh sau khi xử lý xong (tùy chọn)
    if (req.file?.path) fs.unlinkSync(req.file.path);
  }
});

app.listen(3000, () => console.log('API ready on http://localhost:3000'));