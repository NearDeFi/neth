import React, { useContext, useState, useEffect } from 'react';
import { ethers } from "ethers";
import { accountSuffix } from '../utils/near-utils'
import { accountExists } from '../test/test-utils'
import { appStore, onAppMount } from './state/app';
import {
	handleCreate,
	createAccount,
	handleDeployContract,
	handleSetupContract,
	handleCheckAccount,
} from './utils/neth';

import './App.scss';

const ACCOUNT_REGEX = new RegExp('^(([a-z0-9]+[\-_])*[a-z0-9]+\.)*([a-z0-9]+[\-_])*[a-z0-9]+$')

const App = () => {
	const { state, dispatch, update } = useContext(appStore);

	const [accountId, setAccountId] = useState('')
	const [error, setError] = useState('')
	const [signer, setSigner] = useState('')
	const [ethereumId, setEthereumId] = useState('')

	const onMount = () => {
		dispatch(onAppMount());
		handleChooseEthereum(true);
	};
	useEffect(onMount, []);

	const handleChooseEthereum = async (fromMount = false) => {
		const provider = new ethers.providers.Web3Provider(window.ethereum)
		const accounts = await provider.listAccounts();
		if (fromMount && accounts.length === 0) return
		await provider.send("eth_requestAccounts", []);
		const signer = provider.getSigner()
		setSigner(signer)
		setEthereumId(await signer.getAddress())
	}

	const handleAccountInput = async ({ target: { value } }) => {
		setAccountId(value)
		const new_account_id = value + accountSuffix
		if (accountId.indexOf('.') > -1 || !ACCOUNT_REGEX.test(new_account_id) || new_account_id.length > 64) {
			return setError(`account is invalid (a-z, 0-9 and -,_ only; max 64; ${accountSuffix} applied automatically)`)
		}
		if (await accountExists(new_account_id)) {
			setError(`account already exists`)
		} else {
			setError(null)
		}
	}

	return (
		<main className="container">
			{
				ethereumId.length === 0
					?
					<button onClick={() => handleChooseEthereum()}>Choose Ethereum Account</button>
					:
					<>
						<p>{ethereumId}</p>
						<p>To sign out, go to "Connected Sites" in your wallet (MetaMask) and disconnect this one.</p>
						<p>Choose NEAR Account ID</p>
						<input value={accountId} onChange={handleAccountInput} />
						<button disabled={!!error} onClick={() => handleCreate(signer, ethereumId, accountId + accountSuffix)}>Create Account {accountId}.testnet</button>
						{/* <button onClick={handleDeployContract}>Deploy Contract</button>
						<button onClick={handleSetupContract}>Setup Contract</button> */}
						<button onClick={handleCheckAccount}>Check Account</button>
						{error && <p>{error}</p>}
					</>
			}
		</main>
	);
};

export default App;
