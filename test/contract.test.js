const fs = require('fs');
const test = require('ava');
const { generateSeedPhrase } = require('near-seed-phrase');
const nearAPI = require('near-api-js');

/// imports and config
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

/** 
 * Constants used in packing the payload
 */
const PREFIX = 'NETH'
const SIZE_LENGTH = 12;

const pack = (elements) => elements.map((el) => {
	const str = Object.entries(el).map(([k, v]) => `"${k}":"${v}"`).join('')
	return PREFIX + str.length.toString().padStart(SIZE_LENGTH, '0') + str
}).join('')

/** 
 * this allows you to delete and recreate the existing NEAR account (hardcoded below)
 * 
 * the near account for these tests is an implicit account based on the eth private key material, but it doesn't have to be
 */
const DELETE_EXISTING = false;
/// eth accounts used in tests
const { ethers } = require("ethers");
const privateKey = '0x0123456789012345678901234567890123456789012345678901234567890123';
const wallet = new ethers.Wallet(privateKey);
const privateKey2 = '0x1111111111111111111111111111111111111111111111111111111111111111';
const wallet2 = new ethers.Wallet(privateKey2);
/// "0x14791697260E4c9A71f18484C9f997B308e59325"
const address = wallet.address;
console.log('ETH ADDRESS:', address);

/// if keccak256, matches compile time contant in contract
const domain = {
	name: "NETH",
	version: "1",
	chainId: 1313161554, // aurora/near?
};
/// NEAR key for account
const keyPair = {
	publicKey: 'ed25519:2vwEmA557jXcRWjgq1L92RCRDumM6GCYpUgANby8gSD3',
	secretKey: 'ed25519:2Qmnk8KzUh53aRvRyUeCnk1m846pT9YrtaSPw6txzFDs8QmqrsoqC59txo72KAbC39WZyzK16QCzfwQzBErZCCow',
};
/// helpers for creating message hash, args, etc...
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
/// helper generates the arguments for a call to execute() in the contract
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
	console.log(json.transactions)
	/// convenience for devs so they can pass in JSON
	// if (json.transactions) json.transactions = JSON.stringify(json.transactions);
	/// this is automatically done by ethers.js
	const flatSig = await w._signTypedData(domain, types, json);
	/** 
	 * Begin example: manual creation of message hash and signature here for demonstration and 1-1 debugging with contract
	 */
	const prelim = "0x1901";
	const domainHash = '0x1259f716ef38d519cab86b12674f6980042d2c429b3d0b7aa6b6dfa942dcdac2';
	const transactionTypeHash = ethers.utils.id("Transaction(string nonce,string transactions)");
	/// matches compile time constant TX type hash in contract
	// console.log(ethers.utils.arrayify(transactionTypeHash))
	const messageHash = ethers.utils.keccak256([
		prelim,
		domainHash.substring(2),
		ethers.utils.keccak256(encode([
			transactionTypeHash,
			...Object.values(json)
		])).substring(2)
	].join(''));
	const messageHashBytes = ethers.utils.arrayify(messageHash);
	
	const flatSigExample = ethers.utils.joinSignature(await w._signingKey().signDigest(messageHashBytes));
	/// should match
	// console.log(flatSig, flatSigExample);
	/** 
	 * End of example
	 */
	const args = {
		sig: flatSig,
		msg: json,
	};
	// console.log('\nargs\n', JSON.stringify(args), '\n');
	return args;
};

/// some vars re-used in the tests
let accountId, account, nonce;

/** 
 * this test just sets up the NEAR account
 */
test('implicit account w/ entropy from signature; setup', async (t) => {
	const { sig } = await gen_args({
		WARNING: 'MEOW'
	});
	let sigHash = ethers.utils.id(sig);
	/// use 32 bytes of entropy from the signature of the above message to create a NEAR keyPair
	const { seedPhrase, secretKey, publicKey } = generateSeedPhrase(sigHash.substring(2, 34));

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

/** 
 * testing view method of contract
 */
test('get_address', async (t) => {
	const res = await account.viewFunction(
		accountId,
		'get_address'
	);
	console.log('get_address', res);
	t.is(res.toUpperCase(), address.toUpperCase());
});

/** 
 * testing view method of contract
 */
test('get_nonce', async (t) => {
	nonce = parseInt(await account.viewFunction(
		accountId,
		'get_nonce'
	), 16).toString();
	console.log('get_nonce', nonce);
	t.is(nonce, '0');
});

/** 
 * this test intentionally fails when signing a payload (the payload would not work but that doesn't matter)
 * from another ethereum account
 */
test('execute fail wallet2', async (t) => {
	const args = await gen_args({
		nonce,
		transactions: pack([
			{
				receiver_id: accountId,
				actions: pack([{
					hello: 'world!'
				}]),
			}
		]),
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

/** 
 * this test will intentionally fail because the nonce is incorrect
 * again, payload doesn't matter because nonce will fail before
 */
test('execute actions fail incorrect nonce', async (t) => {
	const args = await gen_args({
		nonce: '1',
		transactions: pack([
			{
				receiver_id: accountId,
				actions: pack([{
					hello: 'world!'
				}]),
			}
		])
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

/** 
 * this test will intentionally fail because of the assert_predecessor check
 * only holders of access keys for this account can have signed payloads executed
 */
test('execute fail from another account', async (t) => {
	const args = await gen_args({
		nonce,
		transactions: pack([
			{
				receiver_id: accountId,
				actions: pack([{
					hello: 'world!'
				}]),
			}
		])
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

/** 
 * this test will execute successfully
 * it adds an access key with a 1 N allowance that can only call the execute method on the contract
 */
test('execute batch transaction on account', async (t) => {
	let actions = [
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

	actions = pack(actions)

	const payload = {
		nonce,
		transactions: pack([{
			receiver_id: accountId,
			actions,
		}])
	}

	/// get sig args
	const args = await gen_args(payload);

	const res = await account.functionCall({
		contractId: accountId,
		methodName: 'execute',
		args,
		gas,
	});

	t.true(true);
});

/** 
 * this test will be successful
 * it has a payload for 2 transactions with different receivers
 * the transactions and their actions are executed as 1 promise batch in the contract
 * 
 * NOTE: expected behavior is that if 1 of these transactions fails, the entire transaction batch will fail
 * this means if 1 action, in 1 transaction fails, the entire payload from the client and ALL transactions are reverted
 * 
 * gas limits per transaction are a bit arbitrary here,
 * but 1 transaction must leave gas for others so it's best to be relatively frugal
 * 
 */
test('execute actions on some other contracts', async (t) => {

	/// need a new nonce because the above tx succeeded and new nonce written
	nonce = parseInt(await account.viewFunction(
		accountId,
		'get_nonce'
	), 16).toString();

	/// use limited access key (just re-upped in prev tx)
	const newKeyPair = KeyPair.fromString(keyPair.secretKey);
	keyStore.setKey(networkId, accountId, newKeyPair);

	/// 50 Tgas for the create account tx otherwise it seems to want to use all gas
	/// transfer uses some
	/// 200 Tgas attached to original tx

	const args = await gen_args({
		nonce,
		transactions: pack([
			{
				receiver_id: 'testnet',
				actions: pack([
					{
						type: 'FunctionCall',
						method_name: 'create_account',
						args: obj2hex({
							new_account_id: 'meow-' + Date.now() + '.testnet',
							new_public_key: newKeyPair.publicKey.toString(),
						}),
						amount: parseNearAmount('0.02'),
						gas: '50000000000000',
					}
				])
			},
			{
				receiver_id: 'a.testnet',
				actions: pack([
					{
						type: 'Transfer',
						amount: parseNearAmount('0.00017'),
					}
				])
			},
		])
	});

	const res = await account.functionCall({
		contractId: accountId,
		methodName: 'execute',
		args,
		gas,
	});

	t.true(true);
});

/** 
 * this test is successful
 * 
 * it rotates the application key (used by the apps)
 * check later to make sure nonce is incremented
 * 
 * check existing keys if we have to remove the old app key, just to clean up the keys on the account
 */
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
		nonce,
		transactions: pack([
			{
				receiver_id: accountId,
				actions: pack(actions)
			}
		])
	});

	const res = await account.functionCall({
		contractId: accountId,
		methodName: 'execute',
		args,
		gas,
	});

	t.true(true);
});

/// if "rotate app key" was successful
test('get_app_key_nonce', async (t) => {
	nonce = parseInt(await account.viewFunction(
		accountId,
		'get_app_key_nonce'
	), 16).toString();
	console.log('get_app_key_nonce', nonce);
	t.is(nonce, '2');
});

/// if all prev tests are successful
test('get_nonce 2', async (t) => {
	nonce = parseInt(await account.viewFunction(
		accountId,
		'get_nonce'
	), 16).toString();
	console.log('get_nonce', nonce);
	t.is(nonce, '3');
});

