import { State } from '../utils/state';

// example
const initialState = {
	app: {
		mounted: false
	},
	dialogOk: false,
	dialogOkDisabledKey: null,
	log: [],
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

export const pushLog = (args) => async ({ update, getState }) => {
	const newLog = [...getState().log, JSON.stringify(args)]
	update('log', newLog)
	setTimeout(() => {
		const el = document.querySelector('.log')
		if (el) el.scrollTop = 99999
	}, 150)
	setTimeout(() => {
		const newLog = [...getState().log]
		newLog.shift()
		update('log', newLog)
	}, 3000)
}
