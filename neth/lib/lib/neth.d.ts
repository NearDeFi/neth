import type { WalletModuleFactory, InjectedWallet } from "@near-wallet-selector/core";
export { initConnection } from "./neth-lib";
declare global {
    interface Window {
        ethereum: {
            chainId: string;
        };
    }
}
export interface NethParams {
    useModalCover?: boolean;
    iconUrl?: string;
    gas?: string;
}
export declare function setupNeth({ useModalCover, gas, iconUrl, }?: NethParams): WalletModuleFactory<InjectedWallet>;
