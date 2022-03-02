const fs = require('fs');
const test = require('ava');
const { generateSeedPhrase } = require('near-seed-phrase')
const nearAPI = require('near-api-js')
const {
	KeyPair,
	transactions: { deployContract },
	utils: { PublicKey }
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

const { ethers } = require("ethers");

/// ETH Account Setup (assume this is the MetaMask user)
let privateKey = '0x0123456789012345678901234567890123456789012345678901234567890123';
let wallet = new ethers.Wallet(privateKey);
// "0x14791697260E4c9A71f18484C9f997B308e59325"
console.log('ETH ADDRESS:', wallet.address.substring(2));

/// helper gens the args for each call
const gen_args = async (msg) => {
	console.log('\nargs\n', JSON.stringify(msg), '\n')

	const messageHash = ethers.utils.id(JSON.stringify(msg));
	const messageHashBytes = ethers.utils.arrayify(messageHash)
	const flatSig = await wallet.signMessage(messageHashBytes);

	const args = {
		sig: flatSig,
		msg
	}
	return args
}

const DELETE_EXISTING = false

let account
test('create implicit account with private key from signature', async (t) => {
	const { sig, msg } = await gen_args({
		NEAR_ETH_PRIVATE_KEY: 'DO NOT SIGN THIS IF YOU HAVE ALREADY SET UP YOUR NEAR ACCOUNT USING THIS ETHEREUM ADDRESS'
	})
	let sigHash = ethers.utils.id(sig);
	/// use 32 bytes of entropy from the signature of the above message to create a NEAR keyPair
	const { seedPhrase, secretKey, publicKey } = generateSeedPhrase(sigHash.substring(2, 34))

	const accountId = PublicKey.fromString(publicKey).data.hexSlice()
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
	console.log('deploying contract');
	const actions = [
		deployContract(contractBytes),
	];
	// const state = await account.state()
	// if (state.code_hash === '11111111111111111111111111111111') {
	// 	actions.push(functionCall('new', { linkdrop_contract: network }, GAS))
	// }
	await account.signAndSendTransaction({ receiverId: accountId, actions });
	
	t.true(true)
});

test('test', async (t) => {

	const msg = {
		action: 'hello',
		args: {
			world: 'world',
		}
	}
	const args = await gen_args(msg)

	const res = await account.functionCall({
		contractId,
		methodName: 'test',
		args,
		gas,
	})
	
	t.true(true);
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