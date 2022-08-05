import { State } from '../utils/state';

// example
const initialState = {
	app: {
		mounted: false
	}
};

export const { appStore, AppProvider } = State(initialState, 'app');

// example app function
export const onAppMount = () => async ({ update, getState, dispatch }) => {
	update('app', { mounted: true });
};
