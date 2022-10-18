import React, { useContext, useState, useEffect } from 'react';
import * as nearAPI from "near-api-js";
import { appStore, onAppMount, pushLog } from './state/app';
import { get, set } from './utils/store'
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

const TOS_POP = '__TOS_POP'

const networkIdUrlParam = window.location.search.split('?network=')[1]
export const { nodeUrl, walletUrl, helperUrl, networkId } = getConfig(networkIdUrlParam);
const { Account } = nearAPI

/// valid accounts
const ACCOUNT_REGEX = new RegExp('^(([a-z0-9]+[\-_])*[a-z0-9]+\.)*([a-z0-9]+[\-_])*[a-z0-9]+$')

const tosDialog = (update) => update('', {
	dialog: <>
	<h4>DISCLAIMER & RISKS</h4>
		<div className="tos" onScroll={(e) => {
			if (e.target.scrollTop > 1000) update('tosUnread', false)
		}}>
			YOU EXPLICITLY ACKNOWLEDGE AND ACCEPT THE FOLLOWING HEIGHTENED RISKS. YOU ACKNOWLEDGE AND AGREE THAT THIS SITE SOLELY PROVIDES INFORMATION ABOUT DATA ON THE BLOCKCHAIN. YOU ACCEPT THAT THE SITE OPERATORS HAVE NO CUSTODY OVER YOUR FUNDS, ABILITY OR DUTY TO TRANSACT ON YOUR BEHALF, OR POWER TO REVERSE YOUR TRANSACTIONS. THE SITE OPERATORS DO NOT ENDORSE OR PROVIDE ANY WARRANTY WITH RESPECT TO ANY TOKENS. YOU REPRESENT THAT YOU ARE FINANCIALLY AND TECHNICALLY SOPHISTICATED ENOUGH TO UNDERSTAND THE INHERENT RISKS ASSOCIATED WITH USING CRYPTOGRAPHIC AND BLOCKCHAIN-BASED SYSTEMS AND UPGRADING YOUR SOFTWARE AND PROCESSES TO ACCOMMODATE PROTOCOL UPGRADES, AND THAT YOU HAVE A WORKING KNOWLEDGE OF THE USAGE AND INTRICACIES OF DIGITAL ASSETS AND OTHER DIGITAL TOKENS.  IN PARTICULAR, YOU UNDERSTAND THAT WE DO NOT OPERATE THE ETHEREUM OR NEAR PROTOCOLS OR ANY OTHER BLOCKCHAIN PROTOCOL, COMMUNICATE OR EXECUTE PROTOCOL UPGRADES, OR APPROVE OR PROCESS BLOCKCHAIN TRANSACTIONS ON BEHALF OF YOU.  YOU FURTHER UNDERSTAND THAT BLOCKCHAIN PROTOCOLS PRESENT THEIR OWN RISKS OF USE, THAT SUPPORTING OR PARTICIPATING IN THE PROTOCOL MAY RESULT IN LOSSES IF YOUR PARTICIPATION VIOLATES CERTAIN PROTOCOL RULES, THAT  BLOCKCHAIN-BASED TRANSACTIONS ARE IRREVERSIBLE, THAT YOUR PRIVATE KEY AND BACKUP SEED PHRASE MUST BE KEPT SECRET AT ALL TIMES, THAT WE WILL NOT STORE A BACKUP OF, NOR WILL BE ABLE TO DISCOVER OR RECOVER, YOUR PRIVATE KEY OR BACKUP SEED PHRASE, AND THAT YOU ARE SOLELY RESPONSIBLE FOR ANY APPROVALS OR PERMISSIONS YOU PROVIDE BY CRYPTOGRAPHICALLY SIGNING BLOCKCHAIN MESSAGES OR TRANSACTIONS. YOU FURTHER UNDERSTAND AND ACCEPT THAT DIGITAL TOKENS PRESENT MARKET VOLATILITY RISK, TECHNICAL SOFTWARE RISKS, REGULATORY RISKS, AND CYBERSECURITY RISKS. YOU ACKNOWLEDGE AND ACCEPT THAT THIS IS EXPERIMENTAL AND UNAUDITED TECHNOLOGY AND THAT YOU COULD LOSE ALL OF YOUR DIGITAL ASSETS.
		</div>
		{ networkId === 'mainnet' && <>
			<p>It's <strong>HIGHLY</strong> recommened you switch to <strong>TESTNET</strong> by clicking the button below the disclaimer button.</p>
			<p>Do NOT fund any account on mainnet with funds you CANNOT afford to lose.</p>
		</>}
	</>,
	dialogOk: true,
	dialogOkDisabledKey: 'tosUnread',
	tosUnread: true,
})

/// Components
import { Main, fundingAccountCB, fundingErrorCB, postFundingCB } from './components/Main'
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
			if (!get(TOS_POP)) {
				set(TOS_POP, true)
				tosDialog(update)
			}

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
					await handleCheckAccount(signer, ethAddress, fundingAccountCB(update), fundingErrorCB(update), postFundingCB(update))
					updateEthState()
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

			<button onClick={() => tosDialog(update)}>Terms of Service<span>Click to Read</span></button>

			<a href={networkId === 'mainnet' ? window.location.href + '?network=testnet' : window.location.href.split('?')[0]}>
				<button className='secondary'><span style={{color: '#008800'}}>{networkId}</span>Click to Change</button>
			</a>

			{
				ethAddress.length === 0
					?
					<>
					<h2>Create Account</h2>
					<button aria-busy={loading} disabled={loading} onClick={handleAction(async () => {
						await getEthereum()
						updateEthState()
					})}>Choose Ethereum Account</button>
					</>
					:
					<Main {...componentState} />
			}
		</main>
	</>
};

export default App;
