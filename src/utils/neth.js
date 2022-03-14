import { ethers } from "ethers";
import * as nearAPI from 'near-api-js'
import { parseSeedPhrase, generateSeedPhrase } from 'near-seed-phrase';
const {
	Account,
	KeyPair,
	transactions: { addKey, deleteKey, functionCallAccessKey },
	utils: {
		PublicKey,
		format: { parseNearAmount }
	}
} = nearAPI;
import { connection, keyStore, networkId, contractAccount } from '../../utils/near-utils'
import { accountExists } from '../../test/test-utils'
import { get, set, del } from './store';
import contractPath from 'url:../../out/main.wasm'


const FUNDING_ACCOUNT_ID = 'neth.testnet'
const MAP_ACCOUNT_ID = 'map.neth.testnet'
const ATTEMPT_SECRET_KEY = '__ATTEMPT_SECRET_KEY'
const ATTEMPT_ACCOUNT_ID = '__ATTEMPT_ACCOUNT_ID'
const ATTEMPT_ETH_ADDRESS = '__ATTEMPT_ETH_ADDRESS'
const APP_KEY_SECRET = '__APP_KEY_SECRET'
const APP_KEY_ACCOUNT_ID = '__APP_KEY_ACCOUNT_ID'
const gas = '100000000000000'
/// this is the new account amount 0.21 for account name, keys, contract and 0.01 for mapping contract storage cost
const attachedDeposit = parseNearAmount('0.25')
const attachedDepositMapping = parseNearAmount('0.01')
/// for NEAR keys we need 64 chars hex for publicKey WITHOUT 0x
const pub2hex = (publicKey) => ethers.utils.hexlify(PublicKey.fromString(publicKey).data).substring(2)



/// TODO this will have to substring(2) with next contract deploy
const obj2hex = (obj) => ethers.utils.hexlify(ethers.utils.toUtf8Bytes(JSON.stringify(obj))).substring(2);



/// account creation flow

export const handleCreate = async (signer, ethAddress, newAccountId) => {
	/// get keypair from eth sig entropy for the near-eth account
	const { publicKey: new_public_key, secretKey: new_secret_key } = await keyPairFromEthSig(signer, unlimitedKeyPayload(newAccountId, ethAddress))
	/// store attempt in localStorage so we can recover and retry / resume contract deployment
	set(ATTEMPT_ACCOUNT_ID, newAccountId)
	set(ATTEMPT_SECRET_KEY, new_secret_key)
	set(ATTEMPT_ETH_ADDRESS, ethAddress)
	
	createAccount(newAccountId, new_public_key)
}

const createAccount = async (newAccountId, new_public_key) => {
	/// uses neth.testnet account for funding
	const { secretKey } = parseSeedPhrase(process.env.REACT_APP_FUNDING_SEED_PHRASE);
	const keyPair = KeyPair.fromString(secretKey)
	keyStore.setKey(networkId, FUNDING_ACCOUNT_ID, keyPair);
	const account = new Account(connection, FUNDING_ACCOUNT_ID)
	const res = await account.functionCall({
		contractId: 'testnet',
		methodName: 'create_account',
		args: {
			new_account_id: newAccountId,
			new_public_key
		},
		gas,
		attachedDeposit
	})
	/// check
	console.log(res)

	handleDeployContract()
}

export const handleDeployContract = async () => {
	const { account } = setupFromStorage()

	const contractBytes = new Uint8Array(await fetch(contractPath).then((res) => res.arrayBuffer()));
	console.log('contractBytes.length', contractBytes.length)
	const res = await account.deployContract(contractBytes)
	console.log(res)

	handleSetupContract()
}

export const handleSetupContract = async () => {
	const { account, ethAddress } = setupFromStorage()
	const res = await account.functionCall({
		contractId: account.accountId,
		methodName: 'setup',
		args: { eth_address: ethAddress },
		gas,
	})
	if (res?.status?.SuccessValue !== '') {
		return alert('account setup failed, please try again')
	}
	handleMapping()
}

export const handleMapping = async () => {
	const { account, ethAddress } = setupFromStorage()
	try {
		const res = await account.functionCall({
			contractId: MAP_ACCOUNT_ID,
			methodName: 'set',
			args: { eth_address: ethAddress },
			gas,
			attachedDeposit: attachedDepositMapping,
		})
		console.log(res)
		if (res?.status?.SuccessValue !== '') {
			console.log('account mapping failed failed')
		}
	} catch(e) {
		console.warn(e)
	}
	handleKeys()
}

export const handleKeys = async () => {
	const { account, newAccountId } = setupFromStorage()
	const accessKeys = await account.getAccessKeys()
	// keys are done
	if (accessKeys.length !== 1 || accessKeys[0]?.access_key?.permission !== 'FullAccess') return
	const publicKey = PublicKey.from(accessKeys[0].public_key)
	const actions = [
		// delete the full access key
		deleteKey(publicKey),
		// limited to execute, unlimited allowance
		addKey(publicKey, functionCallAccessKey(newAccountId, ['execute'], null)),
	]
	const res = await account.signAndSendTransaction({
		receiverId: newAccountId,
		actions
	});
	if (res?.status?.SuccessValue !== '') {
		console.log('key rotation failed')
	}
	handleCheckAccount()
}

/// waterfall check everything about account and fill in missing pieces

export const handleCheckAccount = async () => {
	const { newAccountId, newSecretKey, ethAddress } = setupFromStorage()

	console.log('checking account attempt')
	if (!newAccountId || !newSecretKey) {
		return alert('create account first')
	}

	console.log('checking account created')
	if (!await accountExists(newAccountId)) {
		const keyPair = KeyPair.fromString(newSecretKey)
		return createAccount(newAccountId, keyPair.publicKey.toString())
	}

	console.log('checking contract deployed')
	const account = new Account(connection, newAccountId)
	const state = await account.state()
	if (state.code_hash === '11111111111111111111111111111111') {
		return handleDeployContract()
	}

	console.log('checking contract setup')
	try {
		const ethRes = await account.viewFunction(newAccountId, 'get_address')
		// any reason the address wasn't set properly
		if (!ethRes || !ethRes.length) {
			return handleSetupContract()
		}
	} catch(e) {
		// not set at all (wasm error unreachable storage value)
		console.warn(e)
		return handleSetupContract()
	}

	console.log('checking account address mapping')
	const mapRes = await account.viewFunction(MAP_ACCOUNT_ID, 'get_eth', { account_id: newAccountId })
	if (mapRes === null) {
		return handleMapping(account, ethAddress)
	}

	console.log('checking access keys')
	const accessKeys = await account.getAccessKeys()
	if (accessKeys.length === 1 && accessKeys[0]?.access_key?.permission === 'FullAccess') {
		return handleKeys(account)
	}

	console.log('account created, contract deployed, setup, mapping added, keys rotated')
	// del(ATTEMPT_ACCOUNT_ID)
	// del(ATTEMPT_SECRET_KEY)
}

/// helpers

const setupFromStorage = () => {
	const newAccountId = get(ATTEMPT_ACCOUNT_ID)
	const newSecretKey = get(ATTEMPT_SECRET_KEY)
	const ethAddress = get(ATTEMPT_ETH_ADDRESS)
	const account = new Account(connection, newAccountId)
	const keyPair = KeyPair.fromString(newSecretKey)
	keyStore.setKey(networkId, newAccountId, keyPair);
	return { newAccountId, newSecretKey, ethAddress, account, keyPair }
}

/// TODO UPDATE THIS PAYLOAD WITH nonce field

const appKeyPayload = (accountId, appKeyNonce) => ({
	WARNING: `Creating key for: ${accountId}`,
	nonce: appKeyNonce,
	description: `ONLY sign this on apps you trust! This key CAN use up to 1 N for transactions.`,
})

const unlimitedKeyPayload = (accountId) => ({
	WARNING: `ACCESS TO NEAR ACCOUNT: ${accountId}`,
	description: `ONLY sign on this website: ${'https://example.com'}`,
})

const domain = {
    name: "NETH",
    version: "1",
    // chainId: 1, // aurora
    chainId: 1313161554, // aurora
}
/// helper gens the args for each call
const ethSignJson = async (signer, json) => {
	const types = {
		Transaction: []
	}
	Object.entries(json).forEach(([k, v]) => {
		types.Transaction.push({
			type: 'string',
			name: k,
		})
	})
	if (json.actions) json.actions = JSON.stringify(json.actions)
	const sig = await signer._signTypedData(domain, types, json);
	return { sig, msg: json }
};

const keyPairFromEthSig = async (signer, json) => {
	const { sig } = await ethSignJson(signer, json)
	let sigHash = ethers.utils.id(sig);
	/// use 32 bytes of entropy from hash of signature to create NEAR keyPair
	return generateSeedPhrase(sigHash.substring(2, 34));
}

/// app key helpers

export const handleRefreshAppKey = async (signer, ethAddress) => {
	let accountId, secretKey = get(ATTEMPT_SECRET_KEY)
	// if unlimited allowance access key is not in localStorage user will have to sign to generate it
	if (!secretKey) {
		// TODO remove dep on near-utils
		// use any random near account to check mapping
		accountId = await contractAccount.viewFunction(MAP_ACCOUNT_ID, 'get_near', { eth_address: ethAddress });
		const { secretKey: _secretKey } = await keyPairFromEthSig(signer, unlimitedKeyPayload(accountId, ethAddress))
		secretKey = _secretKey
	} else {
		accountId = get(ATTEMPT_ACCOUNT_ID)
	}
	const account = new Account(connection, accountId)
	const keyPair = KeyPair.fromString(secretKey)
	keyStore.setKey(networkId, accountId, keyPair);
	// now refresh app key
	const nonce = parseInt(await account.viewFunction(accountId, 'get_nonce'), 16).toString()
	const appKeyNonce = parseInt(await account.viewFunction(accountId, 'get_app_key_nonce'), 16).toString()
	// new public key based on current nonce which will become the app_key_nonce in contract after this TX
	const { publicKey } = await keyPairFromEthSig(signer, appKeyPayload(accountId, nonce))
	console.log(publicKey)
	public_key = pub2hex(publicKey)
	const actions = [
		{
			type: 'AddKey',
			public_key,
			allowance: parseNearAmount('1'),
			receiver_id: accountId,
			method_names: 'execute',
		},
	]
	/// check keys, find old app key, delete that first
	const accessKeys = await account.getAccessKeys()
	if (accessKeys.some((k) => {
		const functionCallPermission = k?.access_key?.permission?.FunctionCall
		return functionCallPermission.allowance !== null && functionCallPermission.method_names[0] === 'execute'
	})) {
		// old public key based on current app_key_nonce
		const { publicKey: oldPublicKey } = await keyPairFromEthSig(signer, appKeyPayload(accountId, appKeyNonce))
		oldPublicKeyHex = pub2hex(oldPublicKey)
		actions.unshift({
			type: 'DeleteKey',
			public_key: oldPublicKeyHex,
		})
	}
	/// get args for execute call
	const args = await ethSignJson(signer, {
		receiver_id: accountId,
		nonce,
		actions
	});
	const res = await account.functionCall({
		contractId: accountId,
		methodName: 'execute',
		args,
		gas,
	});

	console.log(res)
}

/// for apps

/// ethereum

export const getEthereum = async () => {
	const provider = new ethers.providers.Web3Provider(window.ethereum)
	const accounts = await provider.listAccounts();
	if (accounts.length === 0) {
		await provider.send("eth_requestAccounts", []);
	}
	const signer = provider.getSigner()
	return { signer, ethAddress: await signer.getAddress() }
}

/// near

export const getNear = async () => {
	const secretKey = get(APP_KEY_SECRET)
	const accountId = get(APP_KEY_ACCOUNT_ID)
	if (!secretKey || !accountId) {
		console.log(!secretKey || !accountId)
		await getAppKey(await getEthereum())
		return getNear()
	}
	const account = new Account(connection, accountId)
	const keyPair = KeyPair.fromString(secretKey)
	keyStore.setKey(networkId, accountId, keyPair);
	return { account, accountId, keyPair, secretKey }
}

export const getAppKey = async ({ signer, ethAddress: eth_address }) => {
	const accountId = await contractAccount.viewFunction(MAP_ACCOUNT_ID, 'get_near', { eth_address });
	const appKeyNonce = parseInt(await contractAccount.viewFunction(accountId, 'get_app_key_nonce'), 16).toString()
	const { publicKey, secretKey } = await keyPairFromEthSig(signer, appKeyPayload(accountId, appKeyNonce))
	const account = new Account(connection, accountId)
	const keyPair = KeyPair.fromString(secretKey)
	keyStore.setKey(networkId, accountId, keyPair);
	set(APP_KEY_SECRET, secretKey)
	set(APP_KEY_ACCOUNT_ID, account.accountId)
	return { publicKey, secretKey, account }
}

export const signAndSendTransaction = async ({
	receiverId,
	actions,
}) => {
	const { signer } = await getEthereum()
	const { account, accountId } = await getNear()
	actions = convertActions(actions, accountId, receiverId)
	const nonce = parseInt(await account.viewFunction(accountId, 'get_nonce'), 16).toString()
	const args = await ethSignJson(signer, {
		receiver_id: receiverId,
		nonce,
		actions
	});
	const res = await account.functionCall({
		contractId: accountId,
		methodName: 'execute',
		args,
		gas,
	});
	return res
}

/// helpers

const convertActions = (actions, accountId, receiverId) => actions.map((_action) => {

	const { enum: type } = _action
    const { gas, publicKey, methodName, args, deposit, accessKey, code } = _action[type];

    const action = {
        type: type[0].toUpperCase() + type.substr(1),
        gas: (gas && gas.toString()) || undefined,
        public_key: (publicKey && pub2hex(publicKey)) || undefined,
        method_name: methodName,
        args: (args && obj2hex(args)) || undefined,
        code: (code && obj2hex(code)) || undefined,
        amount: (deposit && deposit.toString()) || undefined,
        permission: undefined,
    };

    if (accessKey) {
        if (receiverId === accountId) {
			action.allowance = parseNearAmount('1')
			action.method_names = 'execute'
			action.receiver_id = accountId
        } else if (accessKey.permission.enum === 'functionCall') {
            const { receiverId, methodNames, allowance } = accessKey.permission.functionCall;
            action.receiver_id = receiverId
            action.allowance = (allowance && allowance.toString()) || parseNearAmount('0.25')
			action.method_names = methodNames.join(',')
        }
    }

    return action;
});