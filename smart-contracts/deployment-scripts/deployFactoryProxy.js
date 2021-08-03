const ethers = require('ethers');
const { upgrades } = require("hardhat");
require("@nomiclabs/hardhat-ethers");
require('@openzeppelin/hardhat-upgrades');

require('dotenv').config();

let FactoryData;

try {
	// The ABI describes how the contract works, it's the result of Hardhat / Truffle compiling the .sol files
	FactoryData = require('../artifacts/contracts/RAIR-ERC721_Factory.sol/RAIR_Token_Factory.json');
} catch (err) {
	console.log('Error! Try running "npm run hardhat:compile" to produce artifacts!');
	console.error(err);
	return;
}

if (!process.env.ADDRESS_PRIVATE_KEY) {
	console.log('Error! You need to provide your private key to the .env file!');
	return;
}

const main = async () => {
	// Connect to the Binance Testnet, this JsonRpcProvider can be used to connect to any Blockchain!
	let binanceTestnetProvider = new ethers.providers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/', {
		chainId: 97, symbol: 'BNB', name: 'Binance Testnet', timeout: 1000000
	});
	console.log(`Connected to ${binanceTestnetProvider._network.name}!`);

	// To deploy anything we need a wallet address, to do transactions on behalf of that account a private key must be provided
	// 		Write your private key on a .env file so it remains a secret!
	let currentWallet = new ethers.Wallet(process.env.ADDRESS_PRIVATE_KEY, binanceTestnetProvider);
	console.log('Balance of', currentWallet.address, 'before the deployment:', (await currentWallet.getBalance()).toString(), binanceTestnetProvider._network.symbol);

	// The contract factory holds all the information about the contract, using the ABI and the Bytecode, the address will be the deployer and owner of the contract
	let FactoryFactory = await new ethers.ContractFactory(FactoryData.abi, FactoryData.bytecode, currentWallet);

	// For deployment, the factory requires 2 things:
	//		The number of ERC777 tokens required to deploy an ERC721
	// 			and the address of the ERC777
	let factoryInstance = await upgrades.deployProxy(FactoryFactory, [10, '0x51eA5316F2A9062e1cAB3c498cCA2924A7AB03b1'], {initializer: 'initialize', gasLimit: 4090000});
	try {
		await factoryInstance.deployed();
	} catch (err) {
		console.error(err);
	}
	console.log('The Factory contract is deployed! Find it on address', factoryInstance.address);
	console.log('Gas Price:', factoryInstance.deployTransaction.gasPrice.toString());
	console.log('Gas Limit:', factoryInstance.deployTransaction.gasLimit.toString());
	console.log('Transaction Hash:', factoryInstance.deployTransaction.hash);
	console.log('Chain ID:', factoryInstance.deployTransaction.chainId);

	console.log('Balance of', currentWallet.address, 'after the deployment:', (await currentWallet.getBalance()).toString(), binanceTestnetProvider._network.symbol);
}

try {
	main()
} catch(err) {
	console.error(err);
}