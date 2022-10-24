import { WalletModuleFactory, InjectedWallet } from "@near-wallet-selector/core";
export { initConnection } from "./neth-lib";
declare global {
    interface Window {
        near: {
            isSignedIn: () => boolean;
        };
        ethereum: {
            chainId: string;
        };
    }
}
export interface NethParams {
    useModalCover?: boolean;
    iconUrl?: string;
}
export declare function setupNeth({ useModalCover, iconUrl, }?: NethParams): WalletModuleFactory<InjectedWallet>;
