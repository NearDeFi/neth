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
    iconUrl?: string;
    gas?: string;
    useModalCover?: boolean;
    bundle?: boolean;
    deprecated?: boolean;
}
export declare function setupNeth({ iconUrl, gas, useModalCover, bundle: _bundle, deprecated, }?: NethParams): WalletModuleFactory<InjectedWallet>;
