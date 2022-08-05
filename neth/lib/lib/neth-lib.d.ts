export function initConnection(network: any): void;
export function getConnection(): {
    near: any;
    connection: any;
    keyStore: nearAPI.keyStores.BrowserLocalStorageKeyStore;
    networkId: any;
    contractAccount: any;
    accountSuffix: any;
};
export function handleCreate(signer: any, ethAddress: any, newAccountId: any): Promise<any>;
export function handleDeployContract(contractPath: any): any;
export function handleSetupContract(): any;
export function handleMapping(): any;
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
export function getAppKey({ signer, ethAddress: eth_address }: {
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
