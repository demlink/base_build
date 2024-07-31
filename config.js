const ethers = require('ethers');
const axios = require('axios');
const Base64 = require('Base64');
require("dotenv").config();

module.exports.myGasPriceForApproval = ethers.utils.parseUnits('6', 'gwei'); // Gas to approve and sell

module.exports.myGasLimit = 1000000; // gas limit doesnt need to be changed if too low transaction will fail

module.exports.strategy =
{ 	// Investment amount per token
    maxBuyTax: 12, 			// max buy tax
    minBuyTax: 0,			// min buy tax
    maxSellTax: 12,			// max sell tax
    minSellTax: 0,           // min sell tax
    gasPrice: ethers.utils.parseUnits('7', 'gwei'), // Gas Price. Higher is better for low liquidity
}


