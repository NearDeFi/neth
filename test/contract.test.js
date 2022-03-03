const fs = require('fs');
const test = require('ava');
const { generateSeedPhrase } = require('near-seed-phrase')
const nearAPI = require('near-api-js')
const {
	KeyPair,
	transactions: { deployContract, functionCall },
	utils: {
		PublicKey,
		format: { parseNearAmount }
	}
} = nearAPI
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

const address = wallet.address.substring(2)
// "0x14791697260E4c9A71f18484C9f997B308e59325"
console.log('ETH ADDRESS:', address);

/// helper gens the args for each call
const gen_args = async (msg, w = wallet) => {
	console.log('\nargs\n', JSON.stringify(msg), '\n')

	const messageHash = ethers.utils.id(JSON.stringify(msg));
	const messageHashBytes = ethers.utils.arrayify(messageHash)
	const flatSig = await w.signMessage(messageHashBytes);

	const args = {
		sig: flatSig,
		msg
	}
	return args
}

const DELETE_EXISTING = false

/// all tests
let accountId, account, nonce

test('implicit account w/ entropy from signature; set_address', async (t) => {
	const { sig } = await gen_args({
		NEAR_ETH_PRIVATE_KEY: 'DO NOT SIGN THIS IF YOU HAVE ALREADY SET UP YOUR NEAR ACCOUNT USING THIS ETHEREUM ADDRESS'
	})
	let sigHash = ethers.utils.id(sig);
	/// use 32 bytes of entropy from the signature of the above message to create a NEAR keyPair
	const { seedPhrase, secretKey, publicKey } = generateSeedPhrase(sigHash.substring(2, 34))

	accountId = PublicKey.fromString(publicKey).data.hexSlice()
	account = new nearAPI.Account(connection, accountId);
	const newKeyPair = KeyPair.fromString(secretKey);
	await keyStore.setKey(networkId, accountId, newKeyPair);

	if (DELETE_EXISTING) {
		const exists = await accountExists(accountId)
		if (exists) {
			console.log('deleting existing account', accountId)
			await account.deleteAccount(contractId)
		}
		console.log('creating account', accountId)
		await contractAccount.sendMoney(accountId, NEW_ACCOUNT_AMOUNT)
	}

	const contractBytes = fs.readFileSync('./out/main.wasm');
	console.log('deploying contract and calling set_address');
	console.log({ address })
	const actions = [
		deployContract(contractBytes),
		functionCall(
			'set_address',
			{ address },
			gas
		),
	];
	// const state = await account.state()
	// if (state.code_hash === '11111111111111111111111111111111') {
	// 	actions.push(functionCall('new', { linkdrop_contract: network }, GAS))
	// }
	await account.signAndSendTransaction({ receiverId: accountId, actions });

	t.true(true)
});

test('get_address', async (t) => {
	const res = await account.viewFunction(
		accountId,
		'get_address'
	)
	console.log('get_address', res)
	t.is(res.toUpperCase(), address.toUpperCase());
});

test('get_nonce', async (t) => {
	nonce = parseInt(await account.viewFunction(
		accountId,
		'get_nonce'
	), 16).toString()
	console.log('get_nonce', nonce)
	t.is(nonce, '0');
});

test('execute fail wallet2', async (t) => {
	const args = await gen_args({
		receiver_id: 'testnet',
		nonce,
		action: 'hello',
	}, wallet2)

	try {
		await account.functionCall({
			contractId: accountId,
			methodName: 'execute',
			args,
			gas,
		})
		t.true(false);
	} catch (e) {
		if (!/explicit guest panic/.test(e)) {
			throw e
		}
		t.true(true);
	}
});

test('execute actions fail incorrect nonce', async (t) => {
	const args = await gen_args({
		receiver_id: 'testnet',
		nonce: '1',
		action: 'hello',
	})

	try {
		await account.functionCall({
			contractId: accountId,
			methodName: 'execute',
			args,
			gas,
		})
		t.true(false);
	} catch (e) {
		if (!/explicit guest panic/.test(e)) {
			throw e
		}
		t.true(true);
	}
});


test('execute actions', async (t) => {

	/// nonce will not have incremented because the above txs failed

	const args = await gen_args({
		receiver_id: 'testnet',
		nonce,
		actions: [
			{
				type: 'Transfer',
				amount: parseNearAmount('0.042'),
			},
			{
				type: 'Transfer',
				amount: parseNearAmount('0.09187431982759'),
			}
		]
	})

	const res = await account.functionCall({
		contractId: accountId,
		methodName: 'execute',
		args,
		gas,
	})

	t.true(true);
});

test('get_nonce 2', async (t) => {
	nonce = parseInt(await account.viewFunction(
		accountId,
		'get_nonce'
	), 16).toString()
	console.log('get_nonce', nonce)
	t.is(nonce, '1');
});






// test.beforeEach((t) => {
// });

let aliceId, bobId, alice, bob;
// test('users initialized', async (t) => {
// 	aliceId = 'alice.' + contractId;
// 	bobId = 'bob.' + contractId;
// 	alice = await getAccount(aliceId);
// 	bob = await getAccount(bobId);

// 	t.true(true);
// });