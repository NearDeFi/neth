import type { WalletModuleFactory, InjectedWallet } from "@near-wallet-selector/core";
export { initConnection } from "./neth-lib";
declare global {
    interface Window {
        contractPath: string | null;
        ethereum: {
            chainId: string;
            request: any;
        };
    }
}
export interface NethParams {
    useModalCover?: boolean;
    iconUrl?: string;
    gas?: string;
    bundle?: boolean;
}
export declare function setupNeth({ useModalCover, bundle: _bundle, gas, iconUrl, }?: NethParams): WalletModuleFactory<InjectedWallet>;
