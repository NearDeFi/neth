const fs = require('fs');
const test = require('ava');
const { generateSeedPhrase } = require('near-seed-phrase');
const nearAPI = require('near-api-js');
const {
	KeyPair,
	transactions: { deployContract, functionCall },
	utils: {
		PublicKey,
		format: { parseNearAmount }
	}
} = nearAPI;
const {
	getAccount, init,
	recordStart, recordStop,
	contractAccount,
	accountExists,
} = require('./test-utils');
const {
	connection,
	keyStore,
} = require('../utils/near-utils');
const getConfig = require("../utils/config");
const {
	networkId,
	contractId,
	gas,
	attachedDeposit,
	NEW_ACCOUNT_AMOUNT,
} = getConfig();

/// ETH Account Setup (assume this is the MetaMask user)
const { ethers } = require("ethers");

const privateKey = '0x0123456789012345678901234567890123456789012345678901234567890123';
const wallet = new ethers.Wallet(privateKey);

const privateKey2 = '0x1111111111111111111111111111111111111111111111111111111111111111';
const wallet2 = new ethers.Wallet(privateKey2);

const address = wallet.address;
// "0x14791697260E4c9A71f18484C9f997B308e59325"
console.log('ETH ADDRESS:', address);

const domain = {
	name: "NETH",
	version: "1",
	chainId: 1313161554, // aurora/near?
};

const keyPair = {
	publicKey: 'ed25519:2vwEmA557jXcRWjgq1L92RCRDumM6GCYpUgANby8gSD3',
	secretKey: 'ed25519:2Qmnk8KzUh53aRvRyUeCnk1m846pT9YrtaSPw6txzFDs8QmqrsoqC59txo72KAbC39WZyzK16QCzfwQzBErZCCow',
};

const DELETE_EXISTING = false;

const obj2hex = (obj) => ethers.utils.hexlify(ethers.utils.toUtf8Bytes(JSON.stringify(obj))).substring(2);

const encode = (arr) => {
	const res = [];
	arr.forEach((str, i) => {
		if (str.indexOf('0x') !== 0) {
			str = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
		}
		res.push(str.substring(2));
	});
	return '0x' + res.join('');
};

/// helper gens the args for each call
const gen_args = async (json, w = wallet) => {

	const types = {
		Transaction: []
	};
	Object.entries(json).forEach(([k, v]) => {
		types.Transaction.push({
			type: 'string',
			name: k,
		});
	});
	if (json.actions) json.actions = JSON.stringify(json.actions);

	// console.log(json.actions, ethers.utils.toUtf8Bytes(json.actions))

	const flatSig = await w._signTypedData(domain, types, json);

	/// how the signature is actually created (demo in JS pre-Rust impl)
	const prelim = "0x1901";
	const domainHash = '0x1259f716ef38d519cab86b12674f6980042d2c429b3d0b7aa6b6dfa942dcdac2';
	// const warningTypeHash = ethers.utils.id("Transaction(string WARNING)")
	const transactionTypeHash = ethers.utils.id("Transaction(string receiver_id,string nonce,string actions)");
	// console.log(ethers.utils.arrayify(prelim))
	const messageHash = ethers.utils.keccak256([
		prelim,
		domainHash.substring(2),
		ethers.utils.keccak256(encode([
			transactionTypeHash,
			...Object.values(json)
		])).substring(2)
	].join(''));
	const messageHashBytes = ethers.utils.arrayify(messageHash);
	const flatSig1 = ethers.utils.joinSignature(await w._signingKey().signDigest(messageHashBytes));

	/// should match
	console.log(flatSig, flatSig1);

	const args = {
		sig: flatSig,
		msg: json,
	};

	// console.log('\nargs\n', JSON.stringify(args), '\n');

	return args;
};

/// all tests
let accountId, account, nonce;

test('implicit account w/ entropy from signature; setup', async (t) => {
	const { sig } = await gen_args({
		WARNING: 'MEOW'
	});
	let sigHash = ethers.utils.id(sig);
	/// use 32 bytes of entropy from the signature of the above message to create a NEAR keyPair
	const { seedPhrase, secretKey, publicKey } = generateSeedPhrase(sigHash.substring(2, 34));

	console.log(secretKey);

	accountId = PublicKey.fromString(publicKey).data.hexSlice();
	console.log('accountId', accountId);
	account = new nearAPI.Account(connection, accountId);
	const newKeyPair = KeyPair.fromString(secretKey);
	keyStore.setKey(networkId, accountId, newKeyPair);

	if (DELETE_EXISTING) {
		const exists = await accountExists(accountId);
		if (exists) {
			console.log('deleting existing account', accountId);
			await account.deleteAccount(contractId);
		}
		console.log('creating account', accountId);
		await contractAccount.sendMoney(accountId, NEW_ACCOUNT_AMOUNT);
	}

	const contractBytes = fs.readFileSync('./out/main.wasm');
	console.log('deploying contract and calling setup');
	const actions = [
		deployContract(contractBytes),
		functionCall(
			'setup',
			{ address },
			gas
		),
	];
	await account.signAndSendTransaction({ receiverId: accountId, actions });

	t.true(true);
});

test('get_address', async (t) => {
	const res = await account.viewFunction(
		accountId,
		'get_address'
	);
	console.log('get_address', res);
	t.is(res.toUpperCase(), address.toUpperCase());
});

test('get_nonce', async (t) => {
	nonce = parseInt(await account.viewFunction(
		accountId,
		'get_nonce'
	), 16).toString();
	console.log('get_nonce', nonce);
	t.is(nonce, '0');
});

test('execute fail wallet2', async (t) => {
	const args = await gen_args({
		receiver_id: accountId,
		nonce,
		actions: [{
			hello: 'world!'
		}]
	}, wallet2);

	try {
		await account.functionCall({
			contractId: accountId,
			methodName: 'execute',
			args,
			gas,
		});
		t.true(false);
	} catch (e) {
		if (!/explicit guest panic/.test(e)) {
			throw e;
		}
		t.true(true);
	}
});

test('execute actions fail incorrect nonce', async (t) => {
	const args = await gen_args({
		receiver_id: accountId,
		nonce: '1',
		actions: [{
			hello: 'world!'
		}],
	});

	try {
		await account.functionCall({
			contractId: accountId,
			methodName: 'execute',
			args,
			gas,
		});
		t.true(false);
	} catch (e) {
		if (!/explicit guest panic/.test(e)) {
			throw e;
		}
		t.true(true);
	}
});

test('execute fail from another account', async (t) => {
	const args = await gen_args({
		receiver_id: accountId,
		nonce,
		actions: [{
			hello: 'world!'
		}],
	});

	try {
		await contractAccount.functionCall({
			contractId: accountId,
			methodName: 'execute',
			args,
			gas,
		});
		t.true(false);
	} catch (e) {
		if (!/explicit guest panic/.test(e)) {
			throw e;
		}
		t.true(true);
	}
});

test('execute actions on account', async (t) => {
	const actions = [
		{
			type: 'AddKey',
			public_key: PublicKey.fromString(keyPair.publicKey).data.hexSlice(),
			allowance: parseNearAmount('1'),
			receiver_id: accountId,
			method_names: 'execute',
		},
		{
			type: 'Transfer',
			amount: parseNearAmount('0.00017'),
		},
	];

	/// check keys
	const public_key = keyPair.publicKey.toString();
	const accessKeys = await account.getAccessKeys();
	if (accessKeys.some((k) => k.public_key === public_key)) {
		actions.unshift({
			type: 'DeleteKey',
			public_key: PublicKey.fromString(keyPair.publicKey).data.hexSlice(),
		});
	}

	/// get sig args
	const args = await gen_args({
		receiver_id: accountId,
		/// nonce will not have incremented because the above txs failed
		nonce,
		actions
	});

	const res = await account.functionCall({
		contractId: accountId,
		methodName: 'execute',
		args,
		gas,
	});

	t.true(true);
});

test('execute actions on some contract', async (t) => {

	/// need a new nonce because the above tx succeeded and new nonce written
	nonce = parseInt(await account.viewFunction(
		accountId,
		'get_nonce'
	), 16).toString();

	/// use limited access key (just re-upped in prev tx)
	const newKeyPair = KeyPair.fromString(keyPair.secretKey);
	keyStore.setKey(networkId, accountId, newKeyPair);

	const args = await gen_args({
		receiver_id: 'testnet',
		nonce,
		actions: [
			{
				type: 'FunctionCall',
				method_name: 'create_account',
				args: obj2hex({
					new_account_id: 'meow-' + Date.now() + '.testnet',
					new_public_key: newKeyPair.publicKey.toString(),
				}),
				amount: parseNearAmount('0.02'),
				gas: '100000000000000',
			},
		]
	});

	const res = await account.functionCall({
		contractId: accountId,
		methodName: 'execute',
		args,
		gas,
	});

	t.true(true);
});

test('rotate app key', async (t) => {

	/// need a new nonce because the above tx succeeded and new nonce written
	nonce = parseInt(await account.viewFunction(
		accountId,
		'get_nonce'
	), 16).toString();

	const actions = [
		{
			type: 'AddKey',
			public_key: PublicKey.fromString(keyPair.publicKey).data.hexSlice(),
			allowance: parseNearAmount('1'),
			receiver_id: accountId,
			method_names: 'execute',
		},
	];
	/// check keys
	const public_key = keyPair.publicKey.toString();
	const accessKeys = await account.getAccessKeys();
	if (accessKeys.some((k) => k.public_key === public_key)) {
		actions.unshift({
			type: 'DeleteKey',
			public_key: PublicKey.fromString(keyPair.publicKey).data.hexSlice(),
		});
	}

	/// get sig args
	const args = await gen_args({
		receiver_id: accountId,
		/// nonce will not have incremented because the above txs failed
		nonce,
		actions
	});

	const res = await account.functionCall({
		contractId: accountId,
		methodName: 'execute',
		args,
		gas,
	});

	t.true(true);
});

test('get_nonce 2', async (t) => {
	nonce = parseInt(await account.viewFunction(
		accountId,
		'get_nonce'
	), 16).toString();
	console.log('get_nonce', nonce);
	t.is(nonce, '3');
});


test('get_app_key_nonce', async (t) => {
	nonce = parseInt(await account.viewFunction(
		accountId,
		'get_app_key_nonce'
	), 16).toString();
	console.log('get_app_key_nonce', nonce);
	t.is(nonce, '2');
});


