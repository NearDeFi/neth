import React, { useContext, useEffect } from 'react';

import { store, onAppMount } from './state/app';

import './App.css';

const App = () => {
	const { state, dispatch, update } = useContext(store);

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
			<p>Hello {state.foo && state.foo.bar.hello}</p>
			<p>clicked: {JSON.stringify(state.clicked)}</p>
			<button onClick={handleClick}>Click Me</button>
		</div>
	);
};

export default App;
