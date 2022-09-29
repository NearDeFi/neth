import { State } from '../utils/state';

// example
const initialState = {
	app: {
		mounted: false
	},
	suffix: '.testnet',
	loading: true,
	mapAccountId: null,
	accountId: '',
	showApps: false,
	error: 'enter an account ID',
	signer: '',
	ethAddress: '',
};

export const { appStore, AppProvider } = State(initialState, 'app');

// example app function
export const onAppMount = () => async ({ update, getState, dispatch }) => {
	update('app', { mounted: true });
};
