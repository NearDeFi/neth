export const NETH_SITE_URL: "https://neth.app";
export const MIN_NEW_ACCOUNT_ASK: string | null;
export function initConnection(network: any, logFn: any): HTMLDivElement;
export function getConnection(): {
    near: any;
    connection: any;
    keyStore: any;
    networkId: any;
    contractAccount: any;
    accountSuffix: any;
};
export function accountExists(accountId: any, ethAddress: any): Promise<boolean>;
export function handleCreate(signer: any, ethAddress: any, newAccountId: any, fundingAccountCB: any, fundingErrorCB: any, postFundingCB: any): Promise<any>;
export function handleCancelFunding(fundingAccountId: any): Promise<void>;
export function handleMapping(): any;
export function handleDeployContract(): any;
export function handleSetupContract(): any;
export function handleKeys(): any;
export function handleCheckAccount({ signer, ethAddress, fundingAccountCB, fundingErrorCB, postFundingCB }: {
    signer: any;
    ethAddress: any;
    fundingAccountCB: any;
    fundingErrorCB: any;
    postFundingCB: any;
}): any;
export function hasAppKey(accessKeys: any): any;
export function handleRefreshAppKey(signer: any, ethAddress: any): Promise<any>;
export function handleUpdateContract(signer: any, ethAddress: any): Promise<any>;
export function handleDisconnect(signer: any, ethAddress: any): Promise<void | {
    account: nearAPI.Account;
}>;
export function getEthereum(): Promise<void | {
    signer: ethers.providers.JsonRpcSigner;
    ethAddress: string;
}>;
export function switchEthereum(): Promise<{
    signer: ethers.providers.JsonRpcSigner;
    ethAddress: string;
}>;
export function getNearMap(eth_address: any): Promise<any>;
export function getNear(): any;
export function signIn(): any;
export function signOut(): Promise<void | {
    accountId: any;
}>;
export function verifyOwner({ message, provider, account }: {
    message: any;
    provider: any;
    account: any;
}): Promise<{
    signature: string;
    accountId: any;
    message: any;
    blockId: any;
    publicKey: string;
    keyType: any;
}>;
export function isSignedIn(): boolean;
export function getAppKey({ signer, ethAddress: eth_address }: {
    signer: any;
    ethAddress: any;
}): any;
export function signAndSendTransactions({ transactions }: {
    transactions: any;
}): Promise<any>;
export function convertActions(actions: any, accountId: any, receiverId: any): any;
import * as nearAPI from "near-api-js";
import { ethers } from "ethers";
