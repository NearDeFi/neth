import React, { useContext, useState, useEffect } from 'react';
import { parseSeedPhrase, generateSeedPhrase } from 'near-seed-phrase';
import { ethers } from "ethers";
import * as nearAPI from 'near-api-js'
const {
	KeyPair,
	transactions: { deployContract, functionCall },
	utils: {
		PublicKey,
		format: { parseNearAmount }
	}
} = nearAPI;
import { connection, keyStore, networkId } from '../utils/near-utils'

import { keyPairFromEthSig } from './utils/neth'
import { appStore, onAppMount } from './state/app';

import './App.scss';

const FUNDING_ACCOUNT_ID = 'neth.testnet'

const App = () => {
	const { state, dispatch, update } = useContext(appStore);

	const [accountId, setAccountId] = useState('')
	const [signer, setSigner] = useState('')
	const [ethereumId, setEthereumId] = useState('')

	const onMount = () => {
		dispatch(onAppMount());
		handleChooseEthereum(true);
	};
	useEffect(onMount, []);

	const handleChooseEthereum = async (fromMount = false) => {
		// A Web3Provider wraps a standard Web3 provider, which is
		// what MetaMask injects as window.ethereum into each page
		const provider = new ethers.providers.Web3Provider(window.ethereum)
		const accounts = await provider.listAccounts();
		if (fromMount && accounts.length === 0) return

		// MetaMask requires requesting permission to connect users accounts
		await provider.send("eth_requestAccounts", []);

		// The MetaMask plugin also allows signing transactions to
		// send ether and pay to change state within the blockchain.
		// For this, you need the account signer...
		const signer = provider.getSigner()
		setSigner(signer)
		setEthereumId(await signer.getAddress())
	}

	const handleCreate = async () => {
		/// get the keypair for the eth account
		const { publicKey } = await keyPairFromEthSig(signer, {
			WARNING: 'DO NOT SIGN THIS IF YOU HAVE ALREADY SET UP A "NEAR ACCOUNT <> ETHEREUM ADDRESS" PAIRING WITH THIS ACCOUNT'
		})
		console.log(publicKey)
		/// uses neth.testnet account
		const { secretKey } = parseSeedPhrase(process.env.REACT_APP_FUNDING_SEED_PHRASE);
		const keyPair = KeyPair.fromString(secretKey)
		keyStore.setKey(networkId, FUNDING_ACCOUNT_ID, keyPair);
		const account = new Account(connection, FUNDING_ACCOUNT_ID)
		// const res = account.functionCall({
		// 	contractId: 'testnet',
		// 	methodName: 'create_account',
		// 	args: {
		// 		new
		// 	}
		// })

	}

	return (
		<main className="container">
			{ !ethereumId.length && <button onClick={() => handleChooseEthereum()}>Choose Ethereum Account</button>}
			<p>{ethereumId}</p>
			<p>To sign out, go to "Connected Sites" in your wallet (MetaMask) and disconnect this one.</p>
			<p>Choose NEAR Account ID</p>
			<input value={accountId} onChange={(e) => setAccountId(e.target.value)} />
			<button onClick={() => handleCreate()}>Create NEAR Account</button>
		</main>
	);
};

export default App;
