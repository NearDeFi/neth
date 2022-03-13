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
import { connection, keyStore, networkId, accountSuffix } from '../../utils/near-utils'
import { accountExists } from '../../test/test-utils'
import contractPath from 'url:../../out/main.wasm'

import { get, set, del } from './store';
/// account creation flow

const FUNDING_ACCOUNT_ID = 'neth.testnet'
const MAP_ACCOUNT_ID = 'map.neth.testnet'
const ATTEMPT_SECRET_KEY = '__ATTEMPT_SECRET_KEY'
const ATTEMPT_ACCOUNT_ID = '__ATTEMPT_ACCOUNT_ID'
const ATTEMPT_ETH_ADDRESS = '__ATTEMPT_ETH_ADDRESS'
const gas = '100000000000000'
/// this is the new account amount 0.21 for account name, keys, contract and 0.01 for mapping contract storage cost
const attachedDeposit = parseNearAmount('0.25')
const attachedDepositMapping = parseNearAmount('0.01')

const setupFromStorage = () => {
	const new_account_id = get(ATTEMPT_ACCOUNT_ID)
	const new_secret_key = get(ATTEMPT_SECRET_KEY)
	const eth_address = get(ATTEMPT_ETH_ADDRESS)
	const account = new Account(connection, new_account_id)
	const keyPair = KeyPair.fromString(new_secret_key)
	keyStore.setKey(networkId, new_account_id, keyPair);
	return { new_account_id, new_secret_key, eth_address, account, keyPair }
}

export const handleCreate = async (signer, ethereumId, new_account_id) => {
	/// get keypair from eth sig entropy for the near-eth account
	const { publicKey: new_public_key, secretKey: new_secret_key } = await keyPairFromEthSig(signer, accountCreatePayload(new_account_id, ethereumId))
	/// store attempt in localStorage so we can recover and retry / resume contract deployment
	set(ATTEMPT_ACCOUNT_ID, new_account_id)
	set(ATTEMPT_SECRET_KEY, new_secret_key)
	set(ATTEMPT_ETH_ADDRESS, ethereumId)
	
	createAccount(new_account_id, new_public_key)
}

export const createAccount = async (new_account_id, new_public_key) => {
	/// uses neth.testnet account for funding
	const { secretKey } = parseSeedPhrase(process.env.REACT_APP_FUNDING_SEED_PHRASE);
	const keyPair = KeyPair.fromString(secretKey)
	keyStore.setKey(networkId, FUNDING_ACCOUNT_ID, keyPair);
	const account = new Account(connection, FUNDING_ACCOUNT_ID)
	const res = await account.functionCall({
		contractId: 'testnet',
		methodName: 'create_account',
		args: {
			new_account_id,
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
	const { account, eth_address } = setupFromStorage()
	const res = await account.functionCall({
		contractId: account.accountId,
		methodName: 'setup',
		args: { eth_address },
		gas,
	})
	if (res?.status?.SuccessValue !== '') {
		return alert('account setup failed, please try again')
	}
	handleMapping()
}

export const handleMapping = async () => {
	const { account, eth_address } = setupFromStorage()

	console.log(account, eth_address)

	try {
		const res = await account.functionCall({
			contractId: MAP_ACCOUNT_ID,
			methodName: 'set',
			args: { eth_address },
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
	const { account, new_account_id } = setupFromStorage()
	const accessKeys = await account.getAccessKeys()
	// keys are done
	if (accessKeys.length !== 1 || accessKeys[0]?.access_key?.permission !== 'FullAccess') return
	const public_key = PublicKey.from(accessKeys[0].public_key)
	const actions = [
		// delete the full access key
		deleteKey(public_key),
		// limited to execute, unlimited allowance
		addKey(public_key, functionCallAccessKey(new_account_id, ['execute'], null)),
	]
	const res = await account.signAndSendTransaction({
		receiverId: new_account_id,
		actions
	});
	if (res?.status?.SuccessValue !== '') {
		console.log('key rotation failed')
	}
	handleCheckAccount()
}

/// waterfall check everything about account and fill in missing pieces
export const handleCheckAccount = async () => {
	const { new_account_id, new_secret_key, eth_address } = setupFromStorage()

	console.log('checking account attempt')
	if (!new_account_id || !new_secret_key) {
		return alert('create account first')
	}

	console.log('checking account created')
	if (!await accountExists(new_account_id)) {
		const keyPair = KeyPair.fromString(new_secret_key)
		return createAccount(new_account_id, keyPair.publicKey.toString())
	}

	console.log('checking contract deployed')
	const account = new Account(connection, new_account_id)
	const state = await account.state()
	if (state.code_hash === '11111111111111111111111111111111') {
		return handleDeployContract()
	}

	console.log('checking contract setup')
	try {
		const ethRes = await account.viewFunction(new_account_id, 'get_address')
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
	const mapRes = await account.viewFunction(MAP_ACCOUNT_ID, 'get_eth', { account_id: new_account_id })
	if (mapRes === null) {
		return handleMapping(account, eth_address)
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

export const appKeyPayload = (new_account_id, ethereumId) => ({
	WARNING: `Creating key for: ${new_account_id}`,
	description: `ONLY sign this on apps you trust! The key will reserve 1 N to spend on transactions.`,
})

export const accountCreatePayload = (new_account_id) => ({
	WARNING: `ACCESS TO NEAR ACCOUNT: ${new_account_id}`,
	description: `ONLY sign on this website: ${'https://example.com'}`,
})

const domain = {
    name: "NETH",
    version: "1",
    chainId: 1, // aurora
    // chainId: 1313161554, // aurora
}
/// helper gens the args for each call
export const ethSignJson = async (signer, json) => {
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
	return sig
};

export const keyPairFromEthSig = async (signer, json) => {
	const sig = await ethSignJson(signer, json)
	let sigHash = ethers.utils.id(sig);
	/// use 32 bytes of entropy from the signature of the above message to create a NEAR keyPair
	return generateSeedPhrase(sigHash.substring(2, 34));
}