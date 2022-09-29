import React from 'react';
import {
	getNear,
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
	signAndSendTransactions,
} from '../../neth/lib';

import { transfer } from 'near-api-js/lib/transaction';
import contractPath from 'url:../../out/main.wasm'
window.contractPath = contractPath

export default Main = ({
	state,
	update,
	signer,
	handleAccountInput,
	handleAction
}) => {

	const {
		suffix,
		loading,
		mapAccountId,
		accountId,
		showApps,
		error,
		ethAddress,
	} = state

	console.log(signer)

	return <>
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
						const { account } = await handleCreate(signer, ethAddress, accountId + suffix)
						alert('Account: ' + account.accountId + ' paired with: ' + ethAddress)
						update('mapAccountId', (await getNearMap(ethAddress)))
					})}>Create Account {accountId}{suffix}</button>
					{error && <p>{error}</p>}
				</>
				:
				<>
					<p>NEAR Account Mapping: {mapAccountId}</p>
					<br />

					<button aria-busy={loading} disabled={loading} onClick={handleAction(async () => {
						const { account } = await handleCheckAccount(ethAddress)
						alert('Account: ' + account.accountId + ' paired with: ' + ethAddress)
						update('mapAccountId', (await getNearMap(ethAddress)))
					})}>Check Account</button>
					<p>This method is in case user drops off / bad network during account setup. It uses saved key material in localStorage from "Create Account" step.</p>
					<br />
					<button aria-busy={loading} disabled={loading} onClick={handleAction(async () => {

						const { publicKey } = await handleRefreshAppKey(signer, ethAddress)
						alert('New app key (publicKey): ' + publicKey)
						updateEthState()

					})}>Get / Change your App Key</button>
					<p>TLDR; 1 sig to access the unlimited allowance access key (this domain only); 1 sig for addKey, (1 sig for deleteKey if user has old app key), and 1 execute sig</p>
					<p>This method will rotate the currently active app key and bump the app key nonce so malicious apps cannot repeatedly drain a new app key allowance (1 N). The user should only sign on the setup domain which is why there is a warning in the payload that produces the app key material.</p>

					{
						showApps &&
						<>
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
								const res = await signAndSendTransactions({
									transactions: [
										{
											receiverId: accountId,
											actions: [
												transfer('1'),
											],
										}
									]
								})
								if (!!res?.status?.SuccessValue) {
									console.warn('error')
								}
								alert('TX success, view on explorer: https://explorer.testnet.near.org/transactions/' + res.transaction.hash)

							})}>Test Transfer</button>
							<p>Transfer 1 yocto to yourself.</p>

							<h2>Account Disconnection / Contract Update</h2>

							<button aria-busy={loading} disabled={loading} onClick={handleAction(async () => {

								const { account } = await handleDisconnect(signer, ethAddress)
								alert('Account: ' + account.accountId + ' disconnected from: ' + ethAddress)
								update('mapAccountId', (await getNearMap(ethAddress)))
							})}>Disconnect Account</button>
							<p>This method is for user to get a seed phrase and disconnect NEAR account from ETH address.</p>
							<br />
							<button aria-busy={loading} disabled={loading} onClick={handleAction(async () => {

								await handleUpdateContract(signer, ethAddress)
								alert('Contract Updated')

							})}>Update Contract</button>
							<p>This method will ask the user to approve a contract update to their NEAR account.</p>

						</>
					}

				</>
		}


	</>
}