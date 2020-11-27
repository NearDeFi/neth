import { State } from '../utils/state';

// example
const initialState = {
	app: {
		mounted: false
	}
};

export const { store, StateProvider } = State(initialState);

// example app function
export const onAppMount = (message) => async ({ update, getState, dispatch }) => {
	update('app', { mounted: true });
	update('clicked', false);
	update('data', { mounted: true });
	await update('', { data: { mounted: false } });

	console.log('getState', getState());

	update('foo.bar', { hello: true });
	update('foo.bar', { hello: false, goodbye: true });
	update('foo', { bar: { hello: true, goodbye: false } });
	update('foo.bar.goodbye', true);

	await new Promise((resolve) => setTimeout(() => {
		console.log('getState', getState());
		resolve();
	}, 2000));

	dispatch(helloWorld(message));
};

export const helloWorld = (message) => async ({ update }) => {
	update('foo.bar.hello', message);
};
