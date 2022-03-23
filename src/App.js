import React, { useContext, useState, useEffect } from 'react';
import { ethers } from "ethers";
import { accountSuffix } from '../utils/near-utils'
import { accountExists } from '../test/test-utils'
import { appStore, onAppMount } from './state/app';
import {
	getNear,
	getEthereum,
	handleCreate,
	switchEthereum,
	handleCheckAccount,
	getNearMap,
	handleDisconnect,
	handleUpdateContract,
	handleRefreshAppKey,
	signIn,
	signOut,
	isSignedIn,
	signAndSendTransaction,
} from './utils/neth';

/// example app transactions
import { addKey, deleteKey, functionCall, transfer, functionCallAccessKey } from 'near-api-js/lib/transaction';

import './App.scss';

const ACCOUNT_REGEX = new RegExp('^(([a-z0-9]+[\-_])*[a-z0-9]+\.)*([a-z0-9]+[\-_])*[a-z0-9]+$')

const App = () => {
	const { state, dispatch, update } = useContext(appStore);

	const [loading, setLoading] = useState(true)
	const [mapAccountId, setMapAccountId] = useState(null)
	const [accountId, setAccountId] = useState('')
	const [error, setError] = useState('')
	const [signer, setSigner] = useState('')
	const [ethAddress, setEthAddress] = useState('')

	const updateEthState = async () => {
		const { signer, ethAddress } = await getEthereum();
		setSigner(signer)
		setEthAddress(ethAddress)
		console.log(ethAddress)
		if (ethAddress) {
			setMapAccountId(await getNearMap(ethAddress))
		}
		setLoading(false)
	}

	useEffect(() => {
		dispatch(onAppMount());
		updateEthState()
	}, []);

	const handleAccountInput = async ({ target: { value } }) => {
		setAccountId(value)
		const newAccountId = value + accountSuffix
		if (accountId.indexOf('.') > -1 || !ACCOUNT_REGEX.test(newAccountId) || newAccountId.length > 64) {
			return setError(`account is invalid (a-z, 0-9 and -,_ only; max 64; ${accountSuffix} applied automatically)`)
		}
		if (await accountExists(newAccountId)) {
			setError(`account already exists`)
		} else {
			setError(null)
		}
	}

	const handleAction = (fn, ...args) => async () => {
		setLoading(true)
		try {
			await fn(...args)
			setLoading(false)
		} catch(e) {
			setLoading(false)
			throw e
		}
	}

	return (
		<main className="container">
			<h2>Account Creation & Pairing</h2>

			{
				ethAddress.length === 0
					?
					<button aria-busy={loading} disabled={loading} onClick={handleAction(() => getEthereum())}>Choose Ethereum Account</button>
					:
					<>
						<p>{ethAddress}</p>
						<button aria-busy={loading} disabled={loading} onClick={handleAction(async () => {
							
							await switchEthereum()
							updateEthState()

						})}>Switch Ethereum Account</button>
						<p>To sign out of your ethereum account completely, go to "Connected Sites" in your wallet (MetaMask) and disconnect this one.</p>
						<br />
						{
							!mapAccountId
								?
								<>
									<p>Choose NEAR Account ID</p>
									<input value={accountId} onChange={handleAccountInput} />
									<button aria-busy={loading} disabled={!!error || loading} onClick={handleAction(async () => {
										const { account } = await handleCreate(signer, ethAddress, accountId + accountSuffix)
										alert('Account: ' + account.accountId + ' paired with: ' + ethAddress)
										setMapAccountId(await getNearMap(ethAddress))
									})}>Create Account {accountId}.testnet</button>
									{error && <p>{error}</p>}
								</>
								:
								<>
									<p>NEAR Account Mapping: {mapAccountId}</p>
									<br />

									<button aria-busy={loading} disabled={loading} onClick={handleAction(async () => {
										const { account } = await handleCheckAccount(ethAddress)
										alert('Account: ' + account.accountId + ' paired with: ' + ethAddress)
										setMapAccountId(await getNearMap(ethAddress))
									})}>Check Account</button>
									<p>This method is in case user drops off / bad network during account setup. It uses saved key material in localStorage from "Create Account" step.</p>
									<br />
									<button aria-busy={loading} disabled={loading} onClick={handleAction(async () => {
										
										const { publicKey } = await handleRefreshAppKey(signer, ethAddress)
										alert('New app key (publicKey): ' + publicKey)
										
									})}>Update App Key</button>
									<p>TLDR; 1 sig to access the unlimited allowance access key (this domain only); 2 app key sigs for key rotation actions addKey, deleteKey; and 1 execute sig</p>
									<p>This method will rotate the currently active app key and bump the app key nonce so malicious apps cannot repeatedly drain a new app key allowance (1 N). The user should only sign on the setup domain which is why there is a warning in the payload that produces the app key material.</p>

									<h2>Account Disconnection / Contract Update</h2>

									<button aria-busy={loading} disabled={loading} onClick={handleAction(async () => {
										
										const { account } = await handleDisconnect(signer, ethAddress)
										alert('Account: ' + account.accountId + ' disconnected from: ' + ethAddress)
										setMapAccountId(await getNearMap(ethAddress))
									})}>Disconnect Account</button>
									<p>This method is for user to get a seed phrase and disconnect NEAR account from ETH address.</p>
									<br />
									<button aria-busy={loading} disabled={loading} onClick={handleAction(async () => {
										
										await handleUpdateContract(signer, ethAddress)
										alert('Contract Updated')
										
									})}>Update Contract</button>
									<p>This method will ask the user to approve a contract update to their NEAR account.</p>

									<h2>For Apps</h2>

									<button aria-busy={loading} disabled={loading} onClick={handleAction(() => {
										
										alert('isSignedIn: ' + isSignedIn())
										
									})}>Is NEAR Account Signed In?</button>
									<p>Check if there's an app key in local storage.</p>
									<br />
									<button aria-busy={loading} disabled={loading} onClick={handleAction(async () => {
										
										const { accountId } = await signIn()
										alert('Signed in: ' + accountId)
										
									})}>Sign In</button>
									<p>This method creates the app key from a signature with the current app key nonce, apps save it in localStorage. This request, storing and checking is done automatically in the "Test Transfer" action below, but you can try it isolated here and it will store the key.</p>
									<br />
									<button aria-busy={loading} disabled={loading} onClick={handleAction(async () => {
										
										const { accountId } = await signOut()
										alert('Signed out: ' + accountId)
										
									})}>Sign Out</button>
									<p>Remove the locally stored app key.</p>
									<br />
									<button aria-busy={loading} disabled={loading} onClick={handleAction(async () => {
										
										const { accountId } = await getNear()
										const res = await signAndSendTransaction({
											receiverId: accountId,
											actions: [
												transfer('1'),
											],
										})
										if (!!res?.status?.SuccessValue) {
											console.warn('error')
										}
										alert('TX success, view on explorer: https://explorer.testnet.near.org/transactions/' + res.transaction.hash)
										
									})}>Test Transfer</button>
									<p>Transfer 1 yocto to yourself.</p>
								</>
						}


					</>
			}
		</main>
	);
};

export default App;
