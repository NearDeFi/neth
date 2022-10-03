export const MIN_NEW_ACCOUNT_ASK: string | null;
export function initConnection(network: any, logFn: any): void;
export function getConnection(): {
    near: any;
    connection: any;
    keyStore: nearAPI.keyStores.BrowserLocalStorageKeyStore;
    networkId: any;
    contractAccount: any;
    accountSuffix: any;
};
export function accountExists(accountId: any): Promise<boolean>;
export function handleCreate(signer: any, ethAddress: any, newAccountId: any, fundingAccountCB: any): Promise<any>;
export function handleMapping(): any;
export function handleDeployContract(): any;
export function handleSetupContract(): any;
export function handleKeys(): any;
export function handleCheckAccount(ethAddress: any): any;
export function hasAppKey(accessKeys: any): any;
export function handleRefreshAppKey(signer: any, ethAddress: any): Promise<void | {
    publicKey: string;
    secretKey: any;
}>;
export function handleUpdateContract(signer: any, ethAddress: any): Promise<void>;
export function handleDisconnect(signer: any, ethAddress: any): Promise<void | {
    account: nearAPI.Account;
}>;
export function getEthereum(): Promise<{
    signer: ethers.providers.JsonRpcSigner;
    ethAddress: string;
}>;
export function switchEthereum(): Promise<void>;
export function getNearMap(ethAddress: any): Promise<any>;
export function getNear(): any;
export function signIn(): any;
export function signOut(): Promise<void | {
    accountId: any;
}>;
export function isSignedIn(): boolean;
export function getAppKey({ signer, ethAddress }: {
    signer: any;
    ethAddress: any;
}): Promise<{
    publicKey: any;
    secretKey: any;
    account: nearAPI.Account;
}>;
export function signAndSendTransactions({ transactions }: {
    transactions: any;
}): Promise<any>;
export function convertActions(actions: any, accountId: any, receiverId: any): any;
import * as nearAPI from "near-api-js";
import { ethers } from "ethers";
