const test = require('ava')
const { generateSeedPhrase } = require('near-seed-phrase');

const nacl = require('tweetnacl');
const crypto = require('crypto');
const bs58 = require('bs58');

const nearAPI = require('near-api-js');
const {
	KeyPair,
	transactions: { deployContract, functionCall },
	utils: {
		PublicKey,
		format: { parseNearAmount },
		serialize: { base_encode }
	}
} = nearAPI;

window = {
	ethereum: {},
	prompt: (...args) => console.log(...args)
}

const nethLib = require("../lib/lib/neth-lib");
const { getNear, signIn, signOut, verifyOwner, signAndSendTransactions, initConnection, getNearMap } = nethLib

const {
	getAccount, init,
	recordStart, recordStop,
	contractAccount,
	accountExists,
} = require('../../test/test-utils');

const {
	connection,
	keyStore,
} = require('../../utils/near-utils');

const getConfig = require("../../utils/config");
const { nodeUrl, walletUrl, helperUrl, networkId } = getConfig('testnet');


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

const gas = '200000000000000';
const attachedDepositMapping = parseNearAmount('0.05');

const implicitAccountId = '88f5847b1769923552238503e6e914bbf6ac92e3143df4ef105f56d64919fbef'

const NETWORK = {
	testnet: {
		FUNDING_ACCOUNT_ID: 'neth.testnet',
		MAP_ACCOUNT_ID: 'map.neth.testnet',
		ROOT_ACCOUNT_ID: 'testnet',
	},
	mainnet: {
		MAP_ACCOUNT_ID: 'nethmap.near',
		ROOT_ACCOUNT_ID: 'near',
	}
}

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

const HEADER_OFFSET = 'NETH';
const HEADER_PAD = 8;
const RECEIVER_MARKER = '|~-_NETH~-_-~RECEIVER_-~|';
const PREFIX = '|NETH_';
const SUFFIX = '_NETH|';

const pack = (elements) => elements.map((el) => {
	const str = typeof el === 'string' ? el : Object.entries(el).map(
		([k, v]) => `${PREFIX}${k}:${typeof v === 'string' ? v : JSON.stringify(v)}${SUFFIX}`
	).join('');

	const len = str.length.toString().padStart(HEADER_PAD, '0');

	return HEADER_OFFSET + len + '__' + str;
}).join('');

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
	/// convenience for devs so they can pass in JSON

	/// hoist any functionCall args containing receiver|account in their key to top level receivers
	/// replaces value with marker, contract fills in marker

	if (json.transactions) {
		Object.values(json.transactions).forEach((tx, i) => {
			tx.actions.forEach((action) => {
				if (!action.args) return;
				Object.entries(action.args).forEach(([key, value]) => {

					/// TODO include check on value to determine valid account_id to be replaced

					if (/receiver_id|account_id/g.test(key)) {
						action.args[key] = RECEIVER_MARKER;
						json.receivers.splice(i+1, 0, value);
					}
				});
			});
		});

		json.transactions = pack(json.transactions.map(({ actions }) => pack(actions)));
	}
	if (json.receivers) {
		const numReceivers = json.receivers.length.toString();
		json.receivers = HEADER_OFFSET + 
			json.receivers.join(',').length.toString().padStart(HEADER_PAD, '0') +
			'__' +
			json.receivers.join(',');
		json.receivers = json.receivers.substring(0, 4) + numReceivers.padStart(3, '0') + json.receivers.substring(7);	
	}
	
	console.log(JSON.stringify(json, null, 4));
	
	/// this is automatically done by ethers.js
	const flatSig = await w._signTypedData(domain, types, json);
	/** 
	 * Begin example: manual creation of message hash and signature here for demonstration and 1-1 debugging with contract
	 */
	const prelim = "0x1901";
	const domainHash = '0x1259f716ef38d519cab86b12674f6980042d2c429b3d0b7aa6b6dfa942dcdac2';
	const transactionTypeHash = ethers.utils.id("Transaction(string nonce,string receivers,string transactions)");
	
	/// matches compile time constant TX type hash in contract
	// console.log(ethers.utils.arrayify(transactionTypeHash))
	// console.log('\n\n', [
	// 	// transactionTypeHash,
	// 	...Object.values(json)
	// ].join(''), '\n\n')
	
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
	// console.log('SIG MATCH?\n\n', flatSig, '\n', flatSigExample, '\n\n');
	/** 
	 * End of example
	 */
	const args = {
		sig: flatSig,
		msg: json,
	};
	// console.log('\nargs\n', JSON.stringify(args, null, 4), '\n');
	return args;
};

const VALID_BLOCK_AGE = 100;

const verifySignature = async (nearAccount, data, signature) => {
    try {
        const hash = crypto.createHash('sha256').update(data).digest();
        const accessKeys = (await nearAccount.getAccessKeys()).filter(({ access_key: { permission } }) =>
            permission === 'FullAccess' ||
            // wallet key
            (
                permission.FunctionCall &&
                permission.FunctionCall.receiver_id === nearAccount.accountId &&
                permission.FunctionCall.method_names.includes('__wallet__metadata')
            ) ||
            // multisig
            (
                permission.FunctionCall &&
                permission.FunctionCall.receiver_id === nearAccount.accountId &&
                permission.FunctionCall.method_names.includes('confirm') &&
                permission.FunctionCall.method_names.includes('add_request')
            )
        );
        return accessKeys.some(it => {
            const publicKey = it.public_key.replace('ed25519:', '');
            return nacl.sign.detached.verify(hash, Buffer.from(signature, 'base64'), bs58.decode(publicKey));
        });
    } catch (e) {
        console.error(e);
        return false;
    }
};


/// some vars re-used in the tests
let accountId, account, nonce;

// test.beforeEach((t) => {
// });


/** 
 * ASSUMES THAT THE ACCOUNT SETUP FROM THE CONTRACT TEST WAS SUCCCESSFUL
 * 
 * YOU MUST FIRST RUN yarn test FROM THE PROJECT ROOT!!!
 * /


/** 
 * testing view method of contract
 */
 test('get_address', async (t) => {
	const { sig } = await gen_args({
		WARNING: 'MEOW'
	});
	let sigHash = ethers.utils.id(sig);
	/// use 32 bytes of entropy from the signature of the above message to create a NEAR keyPair
	const { secretKey, publicKey } = generateSeedPhrase(sigHash.substring(2, 34));
	const keyPair = KeyPair.fromString(secretKey)
	accountId = PublicKey.fromString(publicKey).data.hexSlice();
	keyStore.setKey(networkId, accountId, keyPair);
	account = new nearAPI.Account(connection, accountId);

	const res = await account.viewFunction(
		accountId,
		'get_address'
	);
	console.log('get_address', res);
	t.is(res.toUpperCase(), address.toUpperCase());
});


/** 
 * testing the NETH library
 */
 test('neth init and check mapping', async (t) => {

	await initConnection({
		networkId,
		nodeUrl,
		walletUrl,
		helperUrl,
	})

	let accountId = await getNearMap(address)

	if (!accountId) {
		const res = await account.functionCall({
			contractId: NETWORK[networkId].MAP_ACCOUNT_ID,
			methodName: "set",
			args: { eth_address: address },
			gas,
			attachedDeposit: attachedDepositMapping,
		});
	}

	accountId = await getNearMap(address)

	t.is(implicitAccountId, accountId);
});

 test('neth verify owner', async (t) => {
	const data = await verifyOwner({ message: 'foo', provider: connection.provider, account })
	const sig = data.signature
	delete data.signature
	const encoded = JSON.stringify(data);

	const verifyRes = await verifySignature(account, new Uint8Array(Buffer.from(encoded)), sig)

	t.true(verifyRes)
});