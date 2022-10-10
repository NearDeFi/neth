import React, { useContext, useState, useEffect } from 'react';
import * as nearAPI from "near-api-js";
import { appStore, onAppMount, pushLog } from './state/app';
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

import Logo from './img/neth-logo.svg'
import Text from './img/neth-text.svg'

import './App.scss';
const ATTEMPT_ACCOUNT_ID = '__ATTEMPT_ACCOUNT_ID'

const networkIdUrlParam = window.location.search.split('?network=')[1]
export const { nodeUrl, walletUrl, helperUrl, networkId } = getConfig(networkIdUrlParam);
const { Account } = nearAPI

/// valid accounts
const ACCOUNT_REGEX = new RegExp('^(([a-z0-9]+[\-_])*[a-z0-9]+\.)*([a-z0-9]+[\-_])*[a-z0-9]+$')

/// Components
import { Main, fundingErrorCB, postFundingCB } from './components/Main'
import { Modal } from './components/Modal'

const App = () => {
	const { state, dispatch, update } = useContext(appStore);

	const [signer, setSigner] = useState(null)

	const {
		log,
		suffix,
		loading,
		accountId,
		ethAddress,
	} = state

	const logger = (args) => dispatch(pushLog(args))

	const updateEthState = async () => {

		try {
			await initConnection({
				networkId,
				nodeUrl,
				walletUrl,
				helperUrl,
			}, logger)
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
					await handleCheckAccount(ethAddress, fundingErrorCB(update), postFundingCB(update))
				}
			}
		} catch (e) {
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
		updateEthState,
	}

	return <>
		<Modal {...{state, update}} />
		<header>
			<div>
			<img src={Logo} />
			<img src={Text} />
			</div>
		</header>

		<main className="container">
			<a href={networkId === 'mainnet' ? '/?network=testnet' : '/'}>
				<button className='secondary'><span style={{color: '#008800'}}>{networkId}</span>Click to Change</button>
			</a>

			{
				ethAddress.length === 0
					?
					<>
					<h2>Create Account</h2>
					<button aria-busy={loading} disabled={loading} onClick={handleAction(() => getEthereum())}>Choose Ethereum Account</button>
					</>
					:
					<Main {...componentState} />
			}
		</main>
	</>
};

export default App;
