import { ethers } from "ethers";
import * as nearAPI from "near-api-js";
import { parseSeedPhrase, generateSeedPhrase } from "near-seed-phrase";
import BN from 'bn.js'

const {
	Near,
	Account,
	KeyPair,
	keyStores: { BrowserLocalStorageKeyStore },
	transactions: { addKey, deleteKey, functionCallAccessKey },
	utils: {
		PublicKey,
		format: { parseNearAmount, formatNearAmount },
	},
} = nearAPI;

const NETWORK = {
	testnet: {
		FUNDING_ACCOUNT_ID: "neth.testnet",
		MAP_ACCOUNT_ID: "map.neth.testnet",
	},
	mainnet: {
		MAP_ACCOUNT_ID: "nethmap.near",
	}
}

const ATTEMPT_SECRET_KEY = "__ATTEMPT_SECRET_KEY";
const ATTEMPT_ACCOUNT_ID = "__ATTEMPT_ACCOUNT_ID";
const ATTEMPT_ETH_ADDRESS = "__ATTEMPT_ETH_ADDRESS";
const APP_KEY_SECRET = "__APP_KEY_SECRET";
const APP_KEY_ACCOUNT_ID = "__APP_KEY_ACCOUNT_ID";
const gas = "200000000000000";
const half_gas = "50000000000000";
/// this is the new account amount 0.21 for account name, keys, contract and 0.01 for mapping contract storage cost
const MIN_NEW_ACCOUNT = parseNearAmount("1.5");

/// lkmfawl

const attachedDeposit = parseNearAmount("0.3");
const attachedDepositMapping = parseNearAmount("0.02");

const networks = {
	testnet: {
		mapAccountId: "map.neth.testnet",
	},
	mainnet: {
		mapAccountId: "nethmap.near",
	}
}

/// LocalStorage Helpers

const get = (k) => {
	const v = localStorage.getItem(k);
	if (v?.charAt(0) !== "{") {
		return v;
	}
	try {
		return JSON.parse(v);
	} catch (e) {
		console.warn(e);
	}
};
const set = (k, v) => localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
const del = (k) => localStorage.removeItem(k);

/// NEAR setup

const keyStore = new BrowserLocalStorageKeyStore();
let near, connection, networkId, contractAccount, accountSuffix;
export const initConnection = (network) => {
	near = new Near({
		...network,
		deps: { keyStore },
	});
	connection = near.connection;
	networkId = network.networkId;
	contractAccount = new Account(connection, networkId === "mainnet" ? "near" : networkId);
	accountSuffix = networkId === "mainnet" ? ".near" : "." + networkId;
};
export const getConnection = () => {
	return { near, connection, keyStore, networkId, contractAccount, accountSuffix };
};

/// helpers

export const accountExists = async (accountId) => {
	try {
		const account = new nearAPI.Account(connection, accountId);
		await account.state();
		return true;
	} catch (e) {
		if (!/no such file|does not exist/.test(e.toString())) {
			throw e;
		}
		return false;
	}
};

const buf2hex = (buf) => ethers.utils.hexlify(buf).substring(2);
const pub2hex = (publicKey) =>
	ethers.utils.hexlify(PublicKey.fromString(publicKey).data).substring(2);

const ACCOUNT_REGEX = new RegExp("^(([a-z0-9]+[-_])*[a-z0-9]+.)*([a-z0-9]+[-_])*[a-z0-9]+$");

/// account creation and connection flow

export const handleCreate = async (signer, ethAddress, newAccountId, withImplicit = true) => {
	/// get keypair from eth sig entropy for the near-eth account
	const { publicKey: new_public_key, secretKey: new_secret_key } = await keyPairFromEthSig(
		signer,
		unlimitedKeyPayload(newAccountId, ethAddress),
	);
	/// store attempt in localStorage so we can recover and retry / resume contract deployment
	set(ATTEMPT_ACCOUNT_ID, newAccountId);
	set(ATTEMPT_SECRET_KEY, new_secret_key);
	set(ATTEMPT_ETH_ADDRESS, ethAddress);
	// remove any existing app key
	del(APP_KEY_ACCOUNT_ID);
	del(APP_KEY_SECRET);

	/// TODO wait for implicit funding here and then continue to createAccount

	return await createAccount(newAccountId, new_public_key);
};

const createAccount = async (newAccountId, new_public_key) => {
	const { publicKey, secretKey } = parseSeedPhrase(process.env.REACT_APP_FUNDING_SEED_PHRASE);
	/// assumes implicit is funded, otherwise will warn and cycle here

	const checkImplicitFunded = async () => {
		const implicitAccountId = PublicKey.from(publicKey).data.toString('hex')
		console.log('checking for funding of implicit account', implicitAccountId)
		const account = new Account(connection, implicitAccountId)
		try {
			const balance = await account.getAccountBalance()
			const { available } = balance
			if (new BN(available).sub(new BN(MIN_NEW_ACCOUNT)).lt(new BN('0'))) {
				alert(`There is not enough NEAR (${formatNearAmount(MIN_NEW_ACCOUNT, 4)} minimum) to create a new account and deploy NETH contract. Please deposit more and try again.`)
				return false
			}
		} catch(e) {
			if (!/does not exist/gi.test(e.toString())) throw e
			console.log('not funded, checking again')
			await new Promise((r) => setTimeout(r, 4000))
			return await checkImplicitFunded()
		}
		return true
	}
	/// if not funded properly, return and reload
	if (!(await checkImplicitFunded())) return window.location.reload()
	console.log('implicit account funded', implicitAccountId)
	return

	const implicitAccountId = PublicKey.from(publicKey).data.toString('hex')
	console.log('checking for funding of implicit account', implicitAccountId)
	const account = new Account(connection, implicitAccountId)
	
	const res = await account.functionCall({
		contractId: "testnet",
		methodName: "create_account",
		args: {
			new_account_id: newAccountId,
			new_public_key,
		},
		gas,
		attachedDeposit,
	});
	/// check
	console.log(res);

	return await handleDeployContract();
};

export const handleDeployContract = async (contractPath) => {
	const { account } = setupFromStorage();

	const contractBytes = new Uint8Array(await fetch(contractPath).then((res) => res.arrayBuffer()));
	console.log("contractBytes.length", contractBytes.length);
	const res = await account.deployContract(contractBytes);
	console.log(res);

	return await handleSetupContract();
};

export const handleSetupContract = async () => {
	const { account, ethAddress } = setupFromStorage();
	const res = await account.functionCall({
		contractId: account.accountId,
		methodName: "setup",
		args: { eth_address: ethAddress },
		gas,
	});
	if (res?.status?.SuccessValue !== "") {
		return alert("account setup failed, please try again");
	}
	return await handleMapping();
};

export const handleMapping = async () => {
	const { account, ethAddress } = setupFromStorage();
	try {
		const res = await account.functionCall({
			contractId: NETWORK[networkId].MAP_ACCOUNT_ID,
			methodName: "set",
			args: { eth_address: ethAddress },
			gas,
			attachedDeposit: attachedDepositMapping,
		});
		console.log(res);
		if (res?.status?.SuccessValue !== "") {
			console.log("account mapping failed failed");
		}
	} catch (e) {
		console.warn(e);
	}
	return await handleKeys();
};

export const handleKeys = async () => {
	const { account, newAccountId, ethAddress } = setupFromStorage();
	const accessKeys = await account.getAccessKeys();
	// keys are done
	if (accessKeys.length !== 1 || accessKeys[0]?.access_key?.permission !== "FullAccess") return;
	const publicKey = PublicKey.from(accessKeys[0].public_key);
	const actions = [
		// delete the full access key
		deleteKey(publicKey),
		// limited to execute, unlimited allowance
		addKey(publicKey, functionCallAccessKey(newAccountId, ["execute"], null)),
	];
	const res = await account.signAndSendTransaction({
		receiverId: newAccountId,
		actions,
	});
	if (res?.status?.SuccessValue !== "") {
		console.log("key rotation failed");
	}
	return await handleCheckAccount(ethAddress);
};

/// waterfall check everything about account and fill in missing pieces

export const handleCheckAccount = async (ethAddress) => {
	let { newAccountId, newSecretKey } = setupFromStorage();

	const mapAccountId = await getNearMap(ethAddress);
	if (!mapAccountId) {
		alert("create account first");
	} else {
		newAccountId = mapAccountId;
	}

	console.log("checking account created");
	if (!(await accountExists(newAccountId))) {
		const keyPair = KeyPair.fromString(newSecretKey);
		return createAccount(newAccountId, keyPair.publicKey.toString());
	}

	console.log("checking contract deployed");
	const account = new Account(connection, newAccountId);
	const state = await account.state();
	if (state.code_hash === "11111111111111111111111111111111") {
		return handleDeployContract();
	}

	console.log("checking contract setup");
	try {
		const ethRes = await account.viewFunction(newAccountId, "get_address");
		// any reason the address wasn't set properly
		if (!ethRes || !ethRes.length) {
			return handleSetupContract();
		}
	} catch (e) {
		// not set at all (wasm error unreachable storage value)
		console.warn(e);
		return handleSetupContract();
	}

	console.log("checking account address mapping");
	const mapRes = await account.viewFunction(NETWORK[networkId].MAP_ACCOUNT_ID, "get_eth", {
		account_id: newAccountId,
	});
	if (mapRes === null) {
		return handleMapping(account, ethAddress);
	}

	console.log("checking access keys");
	const accessKeys = await account.getAccessKeys();
	if (accessKeys.length === 1 && accessKeys[0]?.access_key?.permission === "FullAccess") {
		return handleKeys(account);
	}

	console.log("Success! account created, contract deployed, setup, mapping added, keys rotated");

	return { account };
};

/// on same domain as setup

export const hasAppKey = (accessKeys) =>
	accessKeys.some((k) => {
		const functionCallPermission = k?.access_key?.permission?.FunctionCall;
		return (
			functionCallPermission.allowance !== null &&
			functionCallPermission.method_names[0] === "execute"
		);
	});

export const handleRefreshAppKey = async (signer, ethAddress) => {
	const { account, accountId } = await getUnlimitedKeyAccount(signer, ethAddress);

	// now refresh app key
	const nonce = parseInt(await account.viewFunction(accountId, "get_nonce"), 16).toString();
	// new public key based on current nonce which will become the app_key_nonce in contract after this TX
	const { publicKey, secretKey } = await keyPairFromEthSig(signer, appKeyPayload(accountId, nonce));
	console.log(publicKey);
	const public_key = pub2hex(publicKey);
	const actions = [
		{
			type: "AddKey",
			public_key,
			allowance: parseNearAmount("1"),
			receiver_id: accountId,
			method_names: "execute",
		},
	];
	/// check keys, find old app key, delete that first
	const accessKeys = await account.getAccessKeys();
	if (hasAppKey(accessKeys)) {
		// old public key based on current app_key_nonce
		const appKeyNonce = parseInt(
			await account.viewFunction(accountId, "get_app_key_nonce"),
			16,
		).toString();
		const { publicKey: oldPublicKey } = await keyPairFromEthSig(
			signer,
			appKeyPayload(accountId, appKeyNonce),
		);
		const oldPublicKeyHex = pub2hex(oldPublicKey);
		actions.unshift({
			type: "DeleteKey",
			public_key: oldPublicKeyHex,
		});
	}
	/// get args for execute call
	const args = await ethSignJson(signer, {
		nonce,
		receivers: [accountId],
		transactions: [
			{
				actions,
			},
		],
	});
	const res = await account.functionCall({
		contractId: accountId,
		methodName: "execute",
		args,
		gas,
	});

	if (res?.status?.SuccessValue !== "") {
		return console.warn("app key rotation unsuccessful");
	}
	del(APP_KEY_SECRET);
	del(APP_KEY_ACCOUNT_ID);
	return { publicKey: public_key, secretKey };
};

export const handleUpdateContract = async (signer, ethAddress) => {
	const { account, accountId } = await getUnlimitedKeyAccount(signer, ethAddress);

	const contractBytes = new Uint8Array(await fetch(contractPath).then((res) => res.arrayBuffer()));
	const actions = [
		{
			type: "DeployContract",
			code: buf2hex(contractBytes),
		},
	];
	const nonce = parseInt(await account.viewFunction(accountId, "get_nonce"), 16).toString();
	const args = await ethSignJson(signer, {
		nonce,
		receivers: [accountId],
		transactions: [
			{
				actions,
			},
		],
	});
	const res = await account.functionCall({
		contractId: accountId,
		methodName: "execute",
		args,
		gas,
	});
	if (res?.status?.SuccessValue !== "") {
		return console.warn("redeply contract unsuccessful");
	}
};

/// account disconnecting flow

export const handleDisconnect = async (signer, ethAddress) => {
	const { account, accountId, secretKey } = await getUnlimitedKeyAccount(signer, ethAddress);

	const { seedPhrase, publicKey, secretKey: newSecretKey } = generateSeedPhrase();
	const _seedPhrase = window.prompt(
		"Copy this down and keep it safe!!! This is your new seed phrase!!!",
		seedPhrase,
	);
	if (seedPhrase !== _seedPhrase) {
		return alert("There was an error, try copying seed phrase again.");
	}
	const oldUnlimitedKey = KeyPair.fromString(secretKey);

	const actions = [
		{
			type: "DeleteKey",
			public_key: pub2hex(oldUnlimitedKey.publicKey.toString()),
		},
		{
			type: "AddKey",
			public_key: pub2hex(publicKey),
			// special case will add full access key
			allowance: "0",
		},
		{
			type: "FunctionCall",
			method_name: "remove_storage",
			args: "",
			amount: "0",
			gas: half_gas,
		},
		{
			type: "DeployContract",
			code: "",
		},
	];
	/// check keys, find old app key, delete that first
	const accessKeys = await account.getAccessKeys();
	if (
		accessKeys.some((k) => {
			const functionCallPermission = k?.access_key?.permission?.FunctionCall;
			return (
				functionCallPermission?.allowance !== null &&
				functionCallPermission?.method_names[0] === "execute"
			);
		})
	) {
		const appKeyNonce = parseInt(
			await account.viewFunction(accountId, "get_app_key_nonce"),
			16,
		).toString();
		const { publicKey: oldPublicKey } = await keyPairFromEthSig(
			signer,
			appKeyPayload(accountId, appKeyNonce),
		);
		const oldPublicKeyHex = pub2hex(oldPublicKey);
		actions.unshift({
			type: "DeleteKey",
			public_key: oldPublicKeyHex,
		});
	}

	/// get args for execute call
	const nonce = parseInt(await account.viewFunction(accountId, "get_nonce"), 16).toString();
	const args = await ethSignJson(signer, {
		nonce,
		receivers: [accountId],
		transactions: [
			{
				actions,
			},
		],
	});
	const res = await account.functionCall({
		contractId: accountId,
		methodName: "execute",
		args,
		gas,
	});

	if (res?.status?.SuccessValue !== "") {
		return console.warn("app key rotation unsuccessful");
	}

	// remove the mapping (can do this later if user has FAK)

	keyStore.setKey(networkId, accountId, newSecretKey);
	try {
		const res = await account.functionCall({
			contractId: NETWORK[networkId].MAP_ACCOUNT_ID,
			methodName: "del",
			args: {},
			gas,
		});
		console.log(res);
		if (res?.status?.SuccessValue !== "") {
			console.log("account mapping removal failed");
		}
	} catch (e) {
		console.warn(e);
	}

	return { account };
};

/// helpers for account creation and connection domain

const setupFromStorage = () => {
	const newAccountId = get(ATTEMPT_ACCOUNT_ID);
	const newSecretKey = get(ATTEMPT_SECRET_KEY);
	const ethAddress = get(ATTEMPT_ETH_ADDRESS);
	const account = new Account(connection, newAccountId);
	let keyPair;
	if (newSecretKey) {
		keyPair = KeyPair.fromString(newSecretKey);
		keyStore.setKey(networkId, newAccountId, keyPair);
	}
	return { newAccountId, newSecretKey, ethAddress, account, keyPair };
};

const getUnlimitedKeyAccount = async (signer, ethAddress) => {
	let accountId,
		secretKey = get(ATTEMPT_SECRET_KEY);
	// if unlimited allowance access key is not in localStorage user will have to sign to generate it
	if (!secretKey) {
		// TODO remove dep on near-utils
		// use any random near account to check mapping
		accountId = await getNearMap(ethAddress);
		const { secretKey: _secretKey } = await keyPairFromEthSig(
			signer,
			unlimitedKeyPayload(accountId, ethAddress),
		);
		secretKey = _secretKey;
	} else {
		accountId = get(ATTEMPT_ACCOUNT_ID);
	}
	const account = new Account(connection, accountId);
	const keyPair = KeyPair.fromString(secretKey);
	keyStore.setKey(networkId, accountId, keyPair);
	return { account, accountId, secretKey };
};

/** 
 * The access key payloads, unlimited and limited
 */

const appKeyPayload = (accountId, appKeyNonce) => ({
	WARNING: `Creating key for: ${accountId}`,
	nonce: appKeyNonce,
	description: `ONLY sign this on apps you trust! This key CAN use up to 1 N for transactions.`,
});

const unlimitedKeyPayload = (accountId) => ({
	WARNING: `ACCESS TO NEAR ACCOUNT: ${accountId}`,
	description: `ONLY sign on this website: ${"https://example.com"}`,
});

/** 
 * main domain, types and eth signTypedData method
 */

const domain = {
	name: "NETH",
	version: "1",
	// chainId: 1, // aurora
	chainId: 1313161554, // aurora
};

const HEADER_OFFSET = "NETH";
const HEADER_PAD = 8;
const RECEIVER_MARKER = "|~-_NETH~-_-~RECEIVER_-~|";
const PREFIX = "|NETH_";
const SUFFIX = "_NETH|";

const pack = (elements) =>
	elements
		.map((el) => {
			const str =
				typeof el === "string"
					? el
					: Object.entries(el)
						.map(
							([k, v]) =>
								`${PREFIX}${k}:${typeof v === "string" ? v : JSON.stringify(v)}${SUFFIX}`,
						)
						.join("");

			const len = str.length.toString().padStart(HEADER_PAD, "0");

			return HEADER_OFFSET + len + "__" + str;
		})
		.join("");

const ethSignJson = async (signer, json) => {
	const types = {
		Transaction: [],
	};
	Object.entries(json).forEach(([k, v]) => {
		types.Transaction.push({
			type: "string",
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
						json.receivers.splice(i + 1, 0, value);
					}
				});
			});
		});

		json.transactions = pack(json.transactions.map(({ actions }) => pack(actions)));
	}
	if (json.receivers) {
		const numReceivers = json.receivers.length.toString();
		json.receivers =
			HEADER_OFFSET +
			json.receivers.join(",").length.toString().padStart(HEADER_PAD, "0") +
			"__" +
			json.receivers.join(",");
		json.receivers =
			json.receivers.substring(0, 4) + numReceivers.padStart(3, "0") + json.receivers.substring(7);
	}

	const sig = await signer._signTypedData(domain, types, json);

	const args = {
		sig,
		msg: json,
	};
	// console.log('\nargs\n', JSON.stringify(args, null, 4), '\n');
	return args;
};

const keyPairFromEthSig = async (signer, json) => {
	const { sig } = await ethSignJson(signer, json);
	let sigHash = ethers.utils.id(sig);
	/// use 32 bytes of entropy from hash of signature to create NEAR keyPair
	return generateSeedPhrase(sigHash.substring(2, 34));
};

/**
 * Used by apps to signIn and signAndSendTransactions
 */

/// ethereum

export const getEthereum = async () => {
	await window.ethereum.request({
		method: "wallet_switchEthereumChain",
		params: [{ chainId: "0x" + domain.chainId.toString(16) }],
	})

	const provider = new ethers.providers.Web3Provider(window.ethereum);
	const accounts = await provider.listAccounts();
	if (accounts.length === 0) {
		await provider.send("eth_requestAccounts", []);
	}
	const signer = provider.getSigner();
	return { signer, ethAddress: await signer.getAddress() };
};
export const switchEthereum = async () => {
	const provider = new ethers.providers.Web3Provider(window.ethereum);
	await provider.send("wallet_requestPermissions", [{ eth_accounts: {} }]);
};

/// near

export const getNearMap = async (ethAddress) => {
	return contractAccount.viewFunction(NETWORK[networkId].MAP_ACCOUNT_ID, "get_near", { eth_address: ethAddress });
};

export const getNear = async () => {
	const secretKey = get(APP_KEY_SECRET);
	const accountId = get(APP_KEY_ACCOUNT_ID);
	if (!secretKey || !accountId) {
		await getAppKey(await getEthereum());
		return await getNear();
	}
	const account = new Account(connection, accountId);
	const keyPair = KeyPair.fromString(secretKey);
	keyStore.setKey(networkId, accountId, keyPair);
	return { account, accountId, keyPair, secretKey };
};

export const signIn = getNear;

export const signOut = async () => {
	const accountId = get(APP_KEY_ACCOUNT_ID);
	if (!accountId) {
		return console.warn("already signed out");
	}
	del(APP_KEY_SECRET);
	del(APP_KEY_ACCOUNT_ID);
	return { accountId };
};

export const isSignedIn = () => {
	return !!get(APP_KEY_SECRET) || !!get(APP_KEY_ACCOUNT_ID);
};

const promptValidAccountId = async (msg) => {
	const newAccountId = window.prompt(msg);
	if (!newAccountId) {
		throw new Error("NETH Error: failed to pick valid NEAR account name");
	}
	if (
		newAccountId.length < 2 ||
		newAccountId.indexOf(".") > -1 ||
		!ACCOUNT_REGEX.test(newAccountId) ||
		newAccountId.length > 64
	) {
		return promptValidAccountId(
			`account is invalid (a-z, 0-9 and -,_ only; min 2; max 64; ${accountSuffix} applied automatically)`,
		);
	}
	if (await accountExists(newAccountId)) {
		return promptValidAccountId(`account already exists`);
	}
	return newAccountId;
};

export const getAppKey = async ({ signer, ethAddress: eth_address }) => {
	let accountId = await getNearMap(eth_address);
	if (!accountId) {
		/// throw new Error("NETH Error: ethereum account not connected to near account")
		/// prompt for near account name and auto deploy
		const newAccountId = await promptValidAccountId(
			`The Ethereum address ${eth_address} is not connected to a NEAR account yet. Select a NEAR account name and we'll create and connect one for you.`,
		);
		const { account } = await handleCreate(signer, eth_address, newAccountId + accountSuffix);
		accountId = account.accountId;
	}
	const appKeyNonce = parseInt(
		await contractAccount.viewFunction(accountId, "get_app_key_nonce"),
		16,
	).toString();
	const { publicKey, secretKey } = await keyPairFromEthSig(
		signer,
		appKeyPayload(accountId, appKeyNonce),
	);
	const account = new Account(connection, accountId);
	// check that app key exists on account
	const accessKeys = await account.getAccessKeys();
	if (!hasAppKey(accessKeys)) {
		await handleRefreshAppKey(signer, eth_address);
	}
	const keyPair = KeyPair.fromString(secretKey);
	keyStore.setKey(networkId, accountId, keyPair);
	set(APP_KEY_SECRET, secretKey);
	set(APP_KEY_ACCOUNT_ID, account.accountId);
	return { publicKey, secretKey, account };
};

export const signAndSendTransactions = async ({ transactions }) => {
	const { signer } = await getEthereum();
	const { account, accountId } = await getNear();

	const receivers = transactions.map(({ receiverId }) => receiverId);
	const transformedTxs = transactions.map(({ receiverId, actions }) => ({
		actions: convertActions(actions, accountId, receiverId),
	}));

	const nonce = parseInt(await account.viewFunction(accountId, "get_nonce"), 16).toString();
	const args = await ethSignJson(signer, {
		nonce,
		receivers,
		transactions: transformedTxs,
	});

	const res = await account.functionCall({
		contractId: accountId,
		methodName: "execute",
		args,
		gas,
	});
	return res;
};

/// helpers

export const convertActions = (actions, accountId, receiverId) =>
	actions.map((_action) => {
		const { enum: type } = _action;
		let { gas, publicKey, methodName, args, deposit, accessKey, code } = _action[type] || _action;

		const action = {
			type: (type && type[0].toUpperCase() + type.substr(1)) || "FunctionCall",
			gas: (gas && gas.toString()) || undefined,
			public_key: (publicKey && pub2hex(publicKey)) || undefined,
			method_name: methodName,
			args: args || undefined,
			code: code || undefined,
			amount: (deposit && deposit.toString()) || undefined,
			permission: undefined,
		};

		Object.keys(action).forEach((k) => {
			if (action[k] === undefined) delete action[k];
		});

		if (accessKey) {
			if (receiverId === accountId) {
				action.allowance = parseNearAmount("1");
				action.method_names = "execute";
				action.receiver_id = accountId;
			} else if (accessKey.permission.enum === "functionCall") {
				const { receiverId, methodNames, allowance } = accessKey.permission.functionCall;
				action.receiver_id = receiverId;
				action.allowance = (allowance && allowance.toString()) || parseNearAmount("0.25");
				action.method_names = methodNames.join(",");
			}
		}

		return action;
	});
