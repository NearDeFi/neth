import {
	WalletModuleFactory,
	InjectedWallet,
	Action,
	FunctionCallAction,
	WalletBehaviourFactory,
	waitFor,
} from "@near-wallet-selector/core";
import detectEthereumProvider from "@metamask/detect-provider";
import { nethIcon } from "../assets/icons";
import {
	getNear,
	signIn,
	signOut,
	verifyOwner,
	signAndSendTransactions,
	initConnection,
} from "./neth-lib";
export { initConnection } from "./neth-lib";

declare global {
	interface Window {
		near: {
			isSignedIn: () => boolean;
		};
		ethereum: { chainId: string };
	}
}

export interface NethParams {
	useModalCover?: boolean;
	iconUrl?: string;
}

const isInstalled = async () => {
	await detectEthereumProvider();
	return !!window.ethereum;
};

let useCover = false;

const Neth: WalletBehaviourFactory<InjectedWallet> = async ({
	metadata,
	logger,
	options,
	provider,
}) => {

	const cover = initConnection(options.network);

	const isValidActions = (
		actions: Array<Action>
	): actions is Array<FunctionCallAction> => {
		return actions.every((x) => x.type === "FunctionCall");
	};

	const transformActions = (actions: Array<Action>) => {
		const validActions = isValidActions(actions);

		if (!validActions) {
			throw new Error(
				`Only 'FunctionCall' actions types are supported by ${metadata.name}`
			);
		}

		return actions.map((x) => x.params);
	};

	// return the wallet interface for wallet-selector
	return {
		async signIn() {
			let account;
			try {
				account = await signIn();
				if (!account) {
					return [];
				}
			} catch (e) {
				if (!/not connected/.test((e as object).toString())) {
					throw e;
				}
				// console.log(e);
			}
			return [account];
		},

		async signOut() {
			await signOut();
		},

		async verifyOwner({ message }) {
			logger.log("NETH:verifyOwner", { message });

			verifyOwner({ message, provider, account: null });
		},

		async getAccounts() {
			const { accountId } = await getNear();
			return [{ accountId }];
		},

		async signAndSendTransaction({ receiverId, actions }) {
			logger.log("NETH:signAndSendTransaction", {
				receiverId,
				actions,
			});

			return signAndSendTransactions({
				transactions: [
					{
						receiverId,
						actions: transformActions(actions),
					},
				],
			});
		},

		async signAndSendTransactions({ transactions }) {
			logger.log("NETH:signAndSendTransactions", { transactions });

			if (useCover) {
				cover.style.display = "block";
			}

			const transformedTxs = transactions.map(({ receiverId, actions }) => ({
				receiverId,
				actions: transformActions(actions),
			}));

			let res;
			try {
				res = await signAndSendTransactions({
					transactions: transformedTxs,
				});
			} catch (e) {
				/// user cancelled or near network error
				// console.warn(e);
			}

			if (useCover) {
				cover.style.display = "none";
			}

			return res;
		},
	};
};

export function setupNeth({
	useModalCover = false,
	iconUrl = nethIcon,
}: NethParams = {}): WalletModuleFactory<InjectedWallet> {

	return async () => {
		// const mobile = isMobile();
		const installed = await isInstalled();

		useCover = useModalCover;

		if (!installed) {
			return null;
		}

		await waitFor(() => !!window.near?.isSignedIn(), { timeout: 300 }).catch(
			() => false
		);

		return {
			id: "neth",
			type: "injected",
			metadata: {
				name: "NETH Account",
				description: null,
				iconUrl,
				downloadUrl: "https://neardefi.github.io/neth",
				deprecated: false,
				available: true,
			},
			init: Neth,
		};
	};
}
