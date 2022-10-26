import React, { useState } from 'react';
import {
	getNear,
	handleCreate,
	switchEthereum,
	handleCheckAccount,
	getNearMap,
	handleDisconnect,
	handleCancelFunding,
	handleRefreshAppKey,
	signIn,
	signOut,
	isSignedIn,
	signAndSendTransactions,
	MIN_NEW_ACCOUNT_ASK,
} from '../../neth';

import { networkId } from '../App';
import { Info } from 'react-feather';

import { formatNearAmount } from 'near-api-js/lib/utils/format'
import { transfer } from 'near-api-js/lib/transaction';
import contractPath from 'url:../../out/main.wasm'
import { getAppKey } from '../../neth/lib/lib/neth-lib';
window.contractPath = contractPath

const isMobile = (() => {
	let check = false;
	(function (a) {
	  if (
		/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
		  a,
		)
	  )
		check = true;
	})(navigator.userAgent || navigator.vendor);
	return check;
})();


export const fundingAccountCB = (update) => (fundingAccountId) => {
	update('dialog', <>
		<h4>Funding Account</h4>
		<p>Please send {formatNearAmount(MIN_NEW_ACCOUNT_ASK, 4)} NEAR (or more) to the TEMPORARY account below to create your NETH account on NEAR.</p>
		<input defaultValue={fundingAccountId} />
		<button onClick={async () => {
			await handleCancelFunding(fundingAccountId)
			window.location.reload()
		}}>Cancel Funding</button>
	</>)
}

export const fundingErrorCB = (update) => (fundingAccountId, remaining) => {
	update('dialog', <>
		<h4>Funding Account</h4>
		<p>Please send {formatNearAmount(remaining, 4)} NEAR (or more) to the TEMPORARY account below to create your NETH account on NEAR.</p>
		<input defaultValue={fundingAccountId} />
		<button onClick={async () => {
			await handleCancelFunding(fundingAccountId)
			window.location.reload()
		}}>Cancel Funding</button>
	</>)
}

export const postFundingCB = (update) => () => {
	update('dialog', null)
}

export const Main = ({
	state,
	update,
	signer,
	handleAccountInput,
	handleAction,
	updateEthState,
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

	const closeDialog = () => update('dialog', null)

	const AccountStatus = ({ account }) => <>
		<h4>NETH Status</h4>
		<p>Account {account.accountId} on NEAR successfully paired with {ethAddress}!</p>
		<button onClick={closeDialog}>Ok</button>
	</>

	return <>
		<p>
			Connected Ethereum Account<br />
			<span className='small'>{ethAddress}</span>
		</p>

		<button className="secondary" aria-busy={loading} disabled={loading} onClick={handleAction(async () => {

			await switchEthereum()
			updateEthState()

		})}>Switch Ethereum Account <Info onClick={(e) => {
			e.stopPropagation();
			update('dialog', <>
				<p>To sign out of your ethereum account completely, go to "Connected Sites" in your wallet (MetaMask) and disconnect this one.</p>
				<button onClick={closeDialog}>Ok</button>
			</>)
		}} /></button>
		{
			!mapAccountId
				?
				<>
					<p>Choose a NEAR Account ID</p>

					<input value={accountId} onChange={handleAccountInput} />
					<button aria-busy={loading} disabled={!!error || loading} onClick={handleAction(async () => {

						/// TODO get implicit account for funding in parallel to waiting
						const { account } = await handleCreate(signer, ethAddress, accountId + suffix,
							fundingAccountCB(update),
							fundingErrorCB(update),
							postFundingCB(update)
						)

						update('mapAccountId', (await getNearMap(ethAddress)))

						update('dialog', <AccountStatus {...{ account }} />)
						// alert('Account: ' + account.accountId + ' paired with: ' + ethAddress)
					})}>Create Account {accountId}{suffix}</button>
					{error && <p>{error} <Info onClick={(e) => {
						e.stopPropagation();
						update('dialog', <>
							<p>
								Valid Accounts: <br />a-z, 0-9 and -,_ only<br />
								min 2, max 64<br />
								.{networkId} is applied automatically
							</p>
							<button onClick={closeDialog}>Ok</button>
						</>)
					}} /></p>}
				</>
				:
				<>
					<p>
						NEAR Account Connected<br />
						<span className='small'>{mapAccountId}</span>
					</p>

					<button className="secondary" aria-busy={loading} disabled={loading} onClick={handleAction(async () => {
						const { account } = await handleCheckAccount({ ethAddress })
						update('dialog', <AccountStatus {...{ account }} />)
						update('mapAccountId', (await getNearMap(ethAddress)))
					})}>Check NETH Account <Info onClick={(e) => {
						e.stopPropagation();
						update('dialog', <>
							<p>This method is in case you closed your browser or had a bad network during account setup. It uses saved key material in localStorage to recover and complete the setup.</p>
							<button onClick={closeDialog}>Ok</button>
						</>)
					}} /></button>

					<button className={showApps ? 'secondary' : ''} aria-busy={loading} disabled={loading} onClick={handleAction(async () => {
						const { publicKey } = await handleRefreshAppKey(signer, ethAddress)
						update('dialog', <>
							<p>New app key (publicKey): {publicKey} was added</p>
							<button onClick={closeDialog}>Ok</button>
						</>)
						updateEthState()
					})}>Get / Update App Key <Info onClick={(e) => {
						e.stopPropagation();
						update('dialog', <>
							<p>TLDR; You will be asked for 3-4 signatures</p>
							<p>1 sig to access an unlimited allowance access key (this domain only); 1 sig for your new app key, (1 sig for if you have an old app key to delete), and 1 sig to execute the transaction.</p>
							<p>This method will rotate the currently active app key and bump the app key nonce so malicious apps cannot repeatedly drain a new app key allowance (1 N). You should only sign on the setup domain which is why there is a warning in the payload that produces the app key material.</p>
							<button onClick={closeDialog}>Ok</button>
						</>)
					}} /></button>

					{
						false && showApps &&
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
							<p>Transfer 1 yocto NEAR (smallest unit) to yourself.</p>
						</>
					}

					{
						showApps &&
						<>

							<h4>Guestbook Sample App</h4>
							<button onClick={() => {
								const url = 'https://neardefi.github.io/guest-book-wallet-selector/' + (networkId === 'testnet' ? '?network=testnet' : '')
								if (isMobile) return window.location.href = url
								window.open(url)
							}}>Visit App <Info onClick={(e) => {
								e.stopPropagation();
								update('dialog', <>
									<p>
										A sample app that uses <a href="https://github.com/near/wallet-selector/" target="_blank">wallet-selector</a> and <a href="https://github.com/neardefi/neth" target="_blank">NETH</a> so you can try your account.
									</p>
									<button onClick={closeDialog}>Ok</button>
								</>)
							}} /></button>

							<h4>Test Transfer</h4>
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
									alert('There was an error with the transaction, please try again!')
								}
								update('dialog', <>
									<p>Transaction success, view on the <a href={`https://explorer.${networkId}.near.org/transactions/${res.transaction.hash}`} target="_blank">explorer</a>.</p>
									<button onClick={closeDialog}>Ok</button>
								</>)

							})}>Test Transfer <Info onClick={(e) => {
								e.stopPropagation();
								update('dialog', <>
									<p>Test your NETH account by transferring 1 yocto to yourself.</p>
									<button onClick={closeDialog}>Ok</button>
								</>)
							}} /></button>

							<h4>Disconnect Account</h4>

							<button aria-busy={loading} disabled={loading} onClick={handleAction(async () => {

								const { account } = await handleDisconnect(signer, ethAddress)

								update('dialog', <>
									<p>Account {account.accountId} disconnected from {ethAddress} successfully!</p>
									<button onClick={closeDialog}>Ok</button>
								</>)

								update('mapAccountId', (await getNearMap(ethAddress)))
							})}>Disconnect Account <Info onClick={(e) => {
								e.stopPropagation();
								update('dialog', <>
									<p>This will prompt you with a seed phrase. Copy it somewhere safe! Then it will disconnect your NEAR account from your Ethereum Address.</p>
									<p>You can import your seed phrase into any NEAR wallet e.g. <a href={`https://${networkId === 'testnet' ? networkId : 'app'}.mynearwallet.com`} target="_blank">MyNearWallet</a></p>
									<button onClick={closeDialog}>Ok</button>
								</>)
							}} /></button>
							<br />
							<br />
							{/* <br />
							<button aria-busy={loading} disabled={loading} onClick={handleAction(async () => {

								await handleUpdateContract(signer, ethAddress)
								alert('Contract Updated')

							})}>Update Contract</button>
							<p>This method will ask the user to approve a contract update to their NEAR account.</p> */}

						</>
					}

				</>
		}


	</>
}