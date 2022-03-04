const fs = require('fs');
const BN = require('bn.js');
const nearAPI = require('near-api-js');
const { 
	KeyPair,
	utils: { format: {
		formatNearAmount
	} }
} = nearAPI;
const { connection, keyStore, contractAccount } = require('../utils/near-utils');
const getConfig = require("../utils/config");
const {
	networkId, contractId, gas,
	NEW_ACCOUNT_AMOUNT,
} = getConfig();

try {
	fs.mkdirSync('./neardev');
} catch(e) {}

const init = async (owner_id = contractId) => {
	/// try to call new on contract, swallow e if already initialized
	try {
		await contractAccount.functionCall({
			contractId,
			methodName: 'new',
			args: {
				owner_id
			},
			gas
		});
	} catch (e) {
		console.log('contract already initialized');
		if (!/initialized/.test(e.toString())) {
			throw e;
		}
	}
	return contractAccount;
};

const getAccount = async (accountId, fundingAmount = NEW_ACCOUNT_AMOUNT, secret) => {
	const account = new nearAPI.Account(connection, accountId);
	try {
		const secret = fs.readFileSync(`./neardev/${accountId}`, 'utf-8');
		const newKeyPair = KeyPair.fromString(secret);
		keyStore.setKey(networkId, accountId, newKeyPair);
		await account.state();
		return account;
	} catch(e) {
		if (!/no such file|does not exist/.test(e.toString())) {
			throw e;
		}
	}
	return await createAccount(accountId, fundingAmount, secret);
};

const accountExists = async (accountId) => {
	try {
		const account = new nearAPI.Account(connection, accountId);
		await account.state();
		return true;
	} catch(e) {
		if (!/no such file|does not exist/.test(e.toString())) {
			throw e;
		}
		return false;
	}
};

const createAccount = async (accountId, fundingAmount = NEW_ACCOUNT_AMOUNT, secret) => {
	const newKeyPair = secret ? KeyPair.fromString(secret) : KeyPair.fromRandom('ed25519');
	fs.writeFileSync(`./neardev/${accountId}` , newKeyPair.toString(), 'utf-8');
	await contractAccount.createAccount(accountId, newKeyPair.publicKey, fundingAmount);
	keyStore.setKey(networkId, accountId, newKeyPair);
	return new nearAPI.Account(connection, accountId);
};

/// debugging

const getAccountBalance = (accountId) => (new nearAPI.Account(connection, accountId)).getAccountBalance();
const getAccountState = (accountId) => (new nearAPI.Account(connection, accountId)).state();
const stateCost = (balanceBefore, balanceAfter) => formatNearAmount(new BN(balanceAfter.stateStaked).sub(new BN(balanceBefore.stateStaked)).toString(), 8);
const bytesUsed = (stateBefore, stateAfter) => parseInt(stateAfter.storage_usage, 10) - parseInt(stateBefore.storage_usage);

/// analyzing

let data = {};
const recordStart = async (accountId) => {
	data[accountId] = {
		balance: await getAccountBalance(accountId),
		state: await getAccountState(accountId),
	};
};

const recordStop = async (accountId) => {
	const before = data[accountId];
	const after = {
		balance: await getAccountBalance(accountId),
		state: await getAccountState(accountId),
	};

	console.log('\nAnalysis:\n');
	console.log('State stake:', stateCost(before.balance, after.balance));
	console.log('Bytes used:', bytesUsed(before.state, after.state));
	console.log('\n');
};

module.exports = {
	init,
	contractAccount,
	accountExists,
	getAccount,
	createAccount,
	getAccountBalance,
	getAccountState,
	stateCost,
	bytesUsed,
	recordStart,
	recordStop,
};