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
} from '../neth';
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

const check = (update, e, i) => {
	update('tosAgreed_' + i, e.target.checked)
}

const tosDialog = (update, dialogCB) => update('', {

	dialog: <>
		<h4>
			Acknowledge Terms & Disclaimer
		</h4>
		<div className="tos" onScroll={(e) => {
			if (e.target.scrollTop > 550) update('tosUnread', false)
		}}>
			<p>By connecting a wallet, you acknowledge that you have read, understand and agree to the <a href="/tos.pdf" target="_blank">Terms of Use (click here to read)</a>.</p>
				<ul>
				<li>You are not a person or company who is a resident of, is located, incorporated, or has a registered agent in a Restricted Territory (as defined in the Terms of Use).</li>
				<li>You will not in the future access this site while located in the United States of America or a Restricted Territory.</li>
				<li>You are not using, and will not in the future use, a virtual private network or other means to mask your physical location from a Restricted Territory.</li>
				<li>You are lawfully permitted to access this site under the laws of the jurisdiction in which you reside and are located.</li>
				<li>You understand the risks associated with using blockchain technology and that the Site operator has no custody over your funds, no ability or duty to transact on your behalf, and no power to reverse your transactions.</li>
				</ul>
				
			<div>
				<input type="checkbox" onClick={(e) => check(update, e, 0)} /><p>I agree.</p>
			</div>
			
		</div>
		{networkId === 'mainnet' && <>
			<p>It's <strong>HIGHLY</strong> recommened you switch to <strong>TESTNET</strong> by clicking the button below the disclaimer button.</p>
			<p>Do NOT fund any account on mainnet with funds you CANNOT afford to lose.</p>
		</>}
	</>,

	dialogOk: true,
	dialogOkKeys: ['tosAgreed_0'],
	dialogCB,

})

/// Components
import { Main, fundingAccountCB, fundingErrorCB, postFundingCB } from './components/Main'
import { Modal } from './components/Modal'

const App = () => {
	const { state, dispatch, update } = useContext(appStore);

	const [signer, setSigner] = useState(null)

	const {
		log,
		app: { blocked },
		suffix,
		loading,
		accountId,
		ethAddress,
	} = state

	const updateEthState = async () => {

		try {
			
			if (!get(TOS_POP)) {
				return
			}

			await initConnection({
				network: {
					networkId,
					nodeUrl,
					walletUrl,
					helperUrl,
				},
				logger: {
					log: (args) => dispatch(pushLog(args))
				}
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
					await handleCheckAccount({
						signer,
						ethAddress,
						fundingAccountCB: fundingAccountCB(update),
						fundingErrorCB: fundingErrorCB(update),
						postFundingCB: postFundingCB(update)
					})
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

	const tosPop = () => {
		set(TOS_POP, true)
		tosDialog(update, async () => {
			updateEthState()
		})
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
		<Modal {...{ state, update }} />
		
		<div className="app">
		
		<header>
			<div>
				<img src={Logo} />
				<img src={Text} />
			</div>
		</header>

		{
			blocked ?

			<main className="container">
				<h4>Blocked</h4>
				<p>
				Use of neth.app (NETH) is not available to people or companies who are residents of, or are
            located, incorporated, or have a registered agent in, a restricted
            territory. VPNs are also blocked.
			</p>
			<p>
			For more information, please see the <a href="/tos.pdf" target="_blank">Terms of Use (click here to read)</a>.
			</p>
			</main>

	:
		<main className="container">

		<a href={networkId === 'mainnet' ? window.location.href + '?network=testnet' : window.location.href.split('?')[0]}>
			<button className='secondary'><span style={{ color: '#008800' }}>{networkId}</span>Click to Change</button>
		</a>

		{
			ethAddress.length === 0
				?
				<>
					<h2>Create Account</h2>
					<button aria-busy={loading} disabled={loading} onClick={handleAction(tosPop)}>Choose Ethereum Account</button>
				</>
				:
				<Main {...componentState} />
		}
		</main>

		}

		<footer>
			<div>
		<button className="secondary" onClick={() => tosDialog(update)}>Terms of Use</button>
		</div>
		</footer>
		
		</div>
	</>
};

export default App;
