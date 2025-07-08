require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

console.log("RPC_URL:", process.env.RPC_URL);
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY);
module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};