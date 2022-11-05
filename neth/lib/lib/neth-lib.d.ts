import { ethers } from "ethers";
export declare const NETH_SITE_URL = "https://neth.app";
export declare const PREV_NETH_SITE_URL = "neardefi.github.io/neth";
export declare const MIN_NEW_ACCOUNT_ASK: string | null;
export declare const initConnection: ({ network, gas: _gas, logger: _logger, storage: _storage, }: {
    network: any;
    gas?: string | undefined;
    logger?: {
        log: (args: any) => void;
    } | undefined;
    storage?: {
        getItem: (k: any) => any;
        setItem: (k: any, v: any) => void;
        removeItem: (k: any) => void;
    } | undefined;
}) => HTMLDivElement;
export declare const getConnection: () => {
    near: any;
    connection: any;
    keyStore: any;
    networkId: any;
    contractAccount: any;
    accountSuffix: any;
};
export declare const accountExists: (accountId: any, ethAddress?: null) => Promise<boolean>;
export declare const handleCreate: (signer: any, ethAddress: any, newAccountId: any, fundingAccountCB: any, fundingErrorCB: any, postFundingCB: any) => Promise<any>;
export declare const handleCancelFunding: (fundingAccountId: any) => Promise<void>;
export declare const handleMapping: () => any;
export declare const handleDeployContract: () => any;
export declare const handleSetupContract: () => any;
export declare const handleKeys: () => any;
export declare const handleCheckAccount: ({ signer, ethAddress, fundingAccountCB, fundingErrorCB, postFundingCB, }: {
    signer?: null | undefined;
    ethAddress?: null | undefined;
    fundingAccountCB?: null | undefined;
    fundingErrorCB?: null | undefined;
    postFundingCB?: null | undefined;
}) => any;
export declare const hasAppKey: (accessKeys: any) => any;
export declare const handleRefreshAppKey: (signer: any, ethAddress: any) => Promise<any>;
export declare const handleUpdateContract: (signer: any, ethAddress: any) => Promise<any>;
export declare const handleDisconnect: (signer: any, ethAddress: any) => Promise<any>;
/**
 * Used by apps to signIn and signAndSendTransactions
 */
export declare const getEthereum: () => Promise<void | {
    signer: ethers.providers.JsonRpcSigner;
    ethAddress: string;
}>;
export declare const switchEthereum: () => Promise<{
    signer: ethers.providers.JsonRpcSigner;
    ethAddress: string;
}>;
export declare const getNearMap: (eth_address: any) => Promise<any>;
export declare const getNear: () => any;
export declare const signIn: () => any;
export declare const signOut: () => Promise<any>;
export declare const verifyOwner: ({ message, provider, account }: {
    message: any;
    provider: any;
    account: any;
}) => Promise<{
    signature: string;
    accountId: any;
    message: any;
    blockId: any;
    publicKey: string;
    keyType: any;
}>;
export declare const isSignedIn: () => Promise<boolean>;
export declare const getAppKey: ({ signer, ethAddress: eth_address }: {
    signer: any;
    ethAddress: any;
}) => any;
export declare const signAndSendTransactions: ({ transactions, bundle }: {
    transactions: any;
    bundle: any;
}) => Promise<any[] | undefined>;
export declare const convertActions: (actions: any, accountId: any, receiverId: any) => any;
