import React, { createContext, useReducer } from 'react';

export const State = (initialState) => {
	let updatedState;
	const getState = () => updatedState;
	const store = createContext(initialState);
	const { Provider } = store;

	const updateState = (state, path = '', newState = {}) => {
		// console.log('updateState', state, path, newState) // debugging

		if (path.length === 0) {
			return { ...state, ...newState };
		}
		const pathArr = path.split('.');
		const first = pathArr[0];
    
		state = { ...state };
		if (!state[first]) {
			state[first] = {};
		}
		if (pathArr.length === 1) {
			state[first] = typeof newState === 'object' ? {
				...state[first],
				...newState
			} : newState;
		} else {
			state[first] = {
				...state[first],
				...updateState(state[first], pathArr.slice(1).join('.'), newState)
			};
		}

		return state;
	};

	const StateProvider = ({ children }) => {
		const [state, dispatch] = useReducer((state, payload) => {
			const { path, newState } = payload;
			if (path === undefined) {
				return state;
			}
			updatedState = updateState(state, path, newState);
			return updatedState;
		}, initialState);

		const update = (path, newState) => {
			dispatch({ path, newState });
		};
		const wrappedDispatch = (fn) => fn({ update, getState, dispatch: wrappedDispatch });

		return <Provider value={{ update, state, dispatch: wrappedDispatch }}>{children}</Provider>;
	};

	return { store, StateProvider };
};
