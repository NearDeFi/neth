import React, { useContext, useState, useEffect } from 'react';
import { ethers } from "ethers";
import { accountSuffix } from '../utils/near-utils'
import { accountExists } from '../test/test-utils'
import { appStore, onAppMount } from './state/app';
import {
	getNear,
	getEthereum,
	handleCreate,
	handleCheckAccount,
	handleRefreshAppKey,
	signAndSendTransaction,
} from './utils/neth';

/// example app transactions
import { addKey, deleteKey, functionCall, transfer, functionCallAccessKey } from 'near-api-js/lib/transaction';

import './App.scss';

const ACCOUNT_REGEX = new RegExp('^(([a-z0-9]+[\-_])*[a-z0-9]+\.)*([a-z0-9]+[\-_])*[a-z0-9]+$')

const App = () => {
	const { state, dispatch, update } = useContext(appStore);

	const [accountId, setAccountId] = useState('')
	const [error, setError] = useState('')
	const [signer, setSigner] = useState('')
	const [ethAddress, setEthAddress] = useState('')

	const onMount = async () => {
		dispatch(onAppMount());
		const { signer, ethAddress } = await getEthereum();
		setSigner(signer)
		setEthAddress(ethAddress)
	};
	useEffect(onMount, []);

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

	return (
		<main className="container">
			{
				ethAddress.length === 0
					?
					<button onClick={() => getEthereum()}>Choose Ethereum Account</button>
					:
					<>
						<p>{ethAddress}</p>
						<p>To sign out, go to "Connected Sites" in your wallet (MetaMask) and disconnect this one.</p>
						<p>Choose NEAR Account ID</p>
						<input value={accountId} onChange={handleAccountInput} />
						<button disabled={!!error} onClick={() => handleCreate(signer, ethAddress, accountId + accountSuffix)}>Create Account {accountId}.testnet</button>
						<button onClick={handleCheckAccount}>Check Account</button>
						<button onClick={() => handleRefreshAppKey(signer, ethAddress)}>Refresh App Key</button>
						{/* for apps */}
						<button onClick={async () => {
							const { accountId } = await getNear()
							const res = await signAndSendTransaction({
								receiverId: accountId,
								actions: [
									transfer('1'),
								],
							})
							console.log(res)

						}}>Test Transfer</button>
						{error && <p>{error}</p>}
					</>
			}
		</main>
	);
};

export default App;
