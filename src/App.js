import React, { useContext, useEffect } from 'react';

import { appStore, onAppMount } from './state/app';

import HelloMessage from './HelloMessage';

import './App.css';

const App = () => {
	const { state, dispatch, update } = useContext(appStore);

	console.log('state', state);

	const onMount = () => {
		dispatch(onAppMount('world'));
	};
	useEffect(onMount, []);

	const handleClick = () => {
		update('clicked', !state.clicked);
	};

	return (
		<div className="root">
			<HelloMessage message={state.foo && state.foo.bar.hello} />
			<p>clicked: {JSON.stringify(state.clicked)}</p>
			<button onClick={handleClick}>Click Me</button>
		</div>
	);
};

export default App;
