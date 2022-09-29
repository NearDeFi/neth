import React, { useContext, useState, useEffect } from 'react';
import * as nearAPI from "near-api-js";
import { appStore, onAppMount } from './state/app';
import {
	accountExists,
	getConnection,
	getEthereum,
	handleCheckAccount,
	getNearMap,
	hasAppKey,
	initConnection,
} from '../neth/lib';
import getConfig from "../utils/config";
import contractPath from 'url:../out/main.wasm'
window.contractPath = contractPath

import './App.scss';

const ATTEMPT_ACCOUNT_ID = '__ATTEMPT_ACCOUNT_ID'

/// destructure
const { nodeUrl, walletUrl, helperUrl, networkId } = getConfig();
const { Account } = nearAPI

/// valid accounts
const ACCOUNT_REGEX = new RegExp('^(([a-z0-9]+[\-_])*[a-z0-9]+\.)*([a-z0-9]+[\-_])*[a-z0-9]+$')

/// Components
import Main from './components/Main'

const App = () => {
	const { state, dispatch, update } = useContext(appStore);

	const [signer, setSigner] = useState(null)

	const {
		suffix,
		loading,
		accountId,
		ethAddress,
	} = state

	const updateEthState = async () => {
		try {
			await initConnection({
				networkId,
				nodeUrl,
				walletUrl,
				helperUrl,
			})
			const { accountSuffix } = getConnection()
			update('suffix', accountSuffix)
			const { signer, ethAddress } = await getEthereum();
			setSigner(signer)
			update('ethAddress', ethAddress)
			console.log('ethAddress', ethAddress)
			if (ethAddress) {
				const accountId = await getNearMap(ethAddress)
				update('mapAccountId', accountId)
				console.log('mapAccountId', accountId)
				if (!!accountId) {
					const { connection, accountSuffix } = getConnection();
					update('suffix', accountSuffix)
					const account = new Account(connection, accountId);
					const accessKeys = await account.getAccessKeys()
					update('showApps', await hasAppKey(accessKeys))
				}
	
				const attemptAccountId = localStorage.getItem(ATTEMPT_ACCOUNT_ID);
				if (attemptAccountId) {
					await handleCheckAccount(ethAddress)
				}
			}
		} catch(e) {
			console.warn(e)
		} finally {
			update('loading', false)
		}
	}

	useEffect(() => {
		dispatch(onAppMount());
		updateEthState()
	}, []);

	const handleAccountInput = async ({ target: { value } }) => {
		update('accountId', value)
		const newAccountId = value + suffix
		if (value < 2 || accountId.indexOf('.') > -1 || !ACCOUNT_REGEX.test(newAccountId) || newAccountId.length > 64) {
			return update('error', `account is invalid (a-z, 0-9 and -,_ only; min 2; max 64; ${suffix} applied automatically)`)
		}
		if (await accountExists(newAccountId)) {
			update('error', `account already exists`)
		} else {
			update('error', null)
		}
	}

	const handleAction = (fn, ...args) => async () => {
		update('loading', true)
		try {
			await fn(...args)
			update('loading', false)
		} catch (e) {
			update('loading', false)
			throw e
		}
	}

	const componentState = {
		state,
		update,
		signer,
		handleAccountInput,
		handleAction,
	}

	return (
		<main className="container">
			<h2>Account Creation & Pairing</h2>
			{
				ethAddress.length === 0
					?
					<button aria-busy={loading} disabled={loading} onClick={handleAction(() => getEthereum())}>Choose Ethereum Account</button>
					:
					<Main {...componentState} />
			}
		</main>
	);
};

export default App;
