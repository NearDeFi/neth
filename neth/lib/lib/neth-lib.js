"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertActions = exports.signAndSendTransactions = exports.getAppKey = exports.isSignedIn = exports.signOut = exports.signIn = exports.getNear = exports.getNearMap = exports.switchEthereum = exports.getEthereum = exports.handleDisconnect = exports.handleUpdateContract = exports.handleRefreshAppKey = exports.hasAppKey = exports.handleCheckAccount = exports.handleKeys = exports.handleSetupContract = exports.handleDeployContract = exports.handleMapping = exports.handleCreate = exports.accountExists = exports.getConnection = exports.initConnection = void 0;
var ethers_1 = require("ethers");
var nearAPI = __importStar(require("near-api-js"));
var near_seed_phrase_1 = require("near-seed-phrase");
var bn_js_1 = __importDefault(require("bn.js"));
var Near = nearAPI.Near, Account = nearAPI.Account, KeyPair = nearAPI.KeyPair, BrowserLocalStorageKeyStore = nearAPI.keyStores.BrowserLocalStorageKeyStore, _a = nearAPI.transactions, addKey = _a.addKey, deleteKey = _a.deleteKey, functionCallAccessKey = _a.functionCallAccessKey, _b = nearAPI.utils, PublicKey = _b.PublicKey, _c = _b.format, parseNearAmount = _c.parseNearAmount, formatNearAmount = _c.formatNearAmount;
var NETWORK = {
    testnet: {
        FUNDING_ACCOUNT_ID: "neth.testnet",
        MAP_ACCOUNT_ID: "map.neth.testnet",
    },
    mainnet: {
        MAP_ACCOUNT_ID: "nethmap.near",
    }
};
var ATTEMPT_SECRET_KEY = "__ATTEMPT_SECRET_KEY";
var ATTEMPT_ACCOUNT_ID = "__ATTEMPT_ACCOUNT_ID";
var ATTEMPT_ETH_ADDRESS = "__ATTEMPT_ETH_ADDRESS";
var APP_KEY_SECRET = "__APP_KEY_SECRET";
var APP_KEY_ACCOUNT_ID = "__APP_KEY_ACCOUNT_ID";
var gas = "200000000000000";
var half_gas = "50000000000000";
/// this is the new account amount 0.21 for account name, keys, contract and 0.01 for mapping contract storage cost
var MIN_NEW_ACCOUNT = parseNearAmount("0.4");
var MIN_NEW_ACCOUNT_THRESH = parseNearAmount("0.49");
var MIN_NEW_ACCOUNT_ASK = parseNearAmount("0.5");
var FUNDING_CHECK_TIMEOUT = 5000;
/// lkmfawl
var attachedDepositMapping = parseNearAmount("0.02");
var networks = {
    testnet: {
        mapAccountId: "map.neth.testnet",
    },
    mainnet: {
        mapAccountId: "nethmap.near",
    }
};
/// LocalStorage Helpers
var get = function (k) {
    var v = localStorage.getItem(k);
    if ((v === null || v === void 0 ? void 0 : v.charAt(0)) !== "{") {
        return v;
    }
    try {
        return JSON.parse(v);
    }
    catch (e) {
        console.warn(e);
    }
};
var set = function (k, v) { return localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); };
var del = function (k) { return localStorage.removeItem(k); };
/// NEAR setup
var keyStore = new BrowserLocalStorageKeyStore();
var near, connection, networkId, contractAccount, accountSuffix;
var initConnection = function (network) {
    near = new Near(__assign(__assign({}, network), { deps: { keyStore: keyStore } }));
    connection = near.connection;
    networkId = network.networkId;
    contractAccount = new Account(connection, networkId === "mainnet" ? "near" : networkId);
    accountSuffix = networkId === "mainnet" ? ".near" : "." + networkId;
};
exports.initConnection = initConnection;
var getConnection = function () {
    return { near: near, connection: connection, keyStore: keyStore, networkId: networkId, contractAccount: contractAccount, accountSuffix: accountSuffix };
};
exports.getConnection = getConnection;
/// helpers
var accountExists = function (accountId) { return __awaiter(void 0, void 0, void 0, function () {
    var account, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                account = new nearAPI.Account(connection, accountId);
                return [4 /*yield*/, account.state()];
            case 1:
                _a.sent();
                return [2 /*return*/, true];
            case 2:
                e_1 = _a.sent();
                if (!/no such file|does not exist/.test(e_1.toString())) {
                    throw e_1;
                }
                return [2 /*return*/, false];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.accountExists = accountExists;
var buf2hex = function (buf) { return ethers_1.ethers.utils.hexlify(buf).substring(2); };
var pub2hex = function (publicKey) {
    return ethers_1.ethers.utils.hexlify(PublicKey.fromString(publicKey).data).substring(2);
};
var ACCOUNT_REGEX = new RegExp("^(([a-z0-9]+[-_])*[a-z0-9]+.)*([a-z0-9]+[-_])*[a-z0-9]+$");
/// account creation and connection flow
var handleCreate = function (signer, ethAddress, newAccountId, withImplicit) {
    if (withImplicit === void 0) { withImplicit = true; }
    return __awaiter(void 0, void 0, void 0, function () {
        var _a, new_public_key, new_secret_key;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, keyPairFromEthSig(signer, unlimitedKeyPayload(newAccountId, ethAddress))];
                case 1:
                    _a = _b.sent(), new_public_key = _a.publicKey, new_secret_key = _a.secretKey;
                    /// store attempt in localStorage so we can recover and retry / resume contract deployment
                    set(ATTEMPT_ACCOUNT_ID, newAccountId);
                    set(ATTEMPT_SECRET_KEY, new_secret_key);
                    set(ATTEMPT_ETH_ADDRESS, ethAddress);
                    // remove any existing app key
                    del(APP_KEY_ACCOUNT_ID);
                    del(APP_KEY_SECRET);
                    return [4 /*yield*/, createAccount(newAccountId, new_public_key)];
                case 2: 
                /// TODO wait for implicit funding here and then continue to createAccount
                return [2 /*return*/, _b.sent()];
            }
        });
    });
};
exports.handleCreate = handleCreate;
var createAccount = function (newAccountId, new_public_key) { return __awaiter(void 0, void 0, void 0, function () {
    var implicitAccountId, checkImplicitFunded, account, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                checkImplicitFunded = function () { return __awaiter(void 0, void 0, void 0, function () {
                    var account, balance, available, e_2;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                implicitAccountId = PublicKey.from(new_public_key).data.toString('hex');
                                console.log('checking for funding of implicit account', implicitAccountId);
                                account = new Account(connection, implicitAccountId);
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, , 6]);
                                return [4 /*yield*/, account.getAccountBalance()];
                            case 2:
                                balance = _a.sent();
                                available = balance.available;
                                if (new bn_js_1.default(available).sub(new bn_js_1.default(MIN_NEW_ACCOUNT_THRESH)).lt(new bn_js_1.default('0'))) {
                                    alert("There is not enough NEAR (".concat(formatNearAmount(MIN_NEW_ACCOUNT_ASK, 4), " minimum) to create a new account and deploy NETH contract. Please deposit more and try again."));
                                    return [2 /*return*/, false];
                                }
                                return [3 /*break*/, 6];
                            case 3:
                                e_2 = _a.sent();
                                if (!/does not exist/gi.test(e_2.toString()))
                                    throw e_2;
                                console.log('not funded, checking again');
                                return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, FUNDING_CHECK_TIMEOUT); })];
                            case 4:
                                _a.sent();
                                return [4 /*yield*/, checkImplicitFunded()];
                            case 5: return [2 /*return*/, _a.sent()];
                            case 6: return [2 /*return*/, true];
                        }
                    });
                }); };
                return [4 /*yield*/, checkImplicitFunded()];
            case 1:
                /// if not funded properly, return and reload
                if (!(_a.sent()))
                    return [2 /*return*/, window.location.reload()];
                console.log('implicit account funded', implicitAccountId);
                account = setupFromStorage(implicitAccountId).account;
                return [4 /*yield*/, account.functionCall({
                        contractId: "testnet",
                        methodName: "create_account",
                        args: {
                            new_account_id: newAccountId,
                            new_public_key: new_public_key,
                        },
                        gas: gas,
                        attachedDeposit: MIN_NEW_ACCOUNT,
                    })];
            case 2:
                res = _a.sent();
                /// check
                console.log(res);
                /// drain implicit
                return [4 /*yield*/, account.deleteAccount(newAccountId)];
            case 3:
                /// drain implicit
                _a.sent();
                return [4 /*yield*/, (0, exports.handleMapping)()];
            case 4: return [2 /*return*/, _a.sent()];
        }
    });
}); };
var handleMapping = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, account, ethAddress, res, e_3;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = setupFromStorage(), account = _a.account, ethAddress = _a.ethAddress;
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                return [4 /*yield*/, account.functionCall({
                        contractId: NETWORK[networkId].MAP_ACCOUNT_ID,
                        methodName: "set",
                        args: { eth_address: ethAddress },
                        gas: gas,
                        attachedDeposit: attachedDepositMapping,
                    })];
            case 2:
                res = _c.sent();
                console.log(res);
                if (((_b = res === null || res === void 0 ? void 0 : res.status) === null || _b === void 0 ? void 0 : _b.SuccessValue) !== "") {
                    console.log("account mapping failed failed");
                }
                return [3 /*break*/, 4];
            case 3:
                e_3 = _c.sent();
                console.warn(e_3);
                return [3 /*break*/, 4];
            case 4: return [4 /*yield*/, (0, exports.handleDeployContract)()];
            case 5: return [2 /*return*/, _c.sent()];
        }
    });
}); };
exports.handleMapping = handleMapping;
var handleDeployContract = function () { return __awaiter(void 0, void 0, void 0, function () {
    var account, contractPath, contractBytes, _a, res;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                account = setupFromStorage().account;
                contractPath = window === null || window === void 0 ? void 0 : window.contractPath;
                console.log(contractPath);
                _a = Uint8Array.bind;
                return [4 /*yield*/, fetch(contractPath).then(function (res) { return res.arrayBuffer(); })];
            case 1:
                contractBytes = new (_a.apply(Uint8Array, [void 0, _b.sent()]))();
                console.log("contractBytes.length", contractBytes.length);
                return [4 /*yield*/, account.deployContract(contractBytes)];
            case 2:
                res = _b.sent();
                console.log(res);
                return [4 /*yield*/, (0, exports.handleSetupContract)()];
            case 3: return [2 /*return*/, _b.sent()];
        }
    });
}); };
exports.handleDeployContract = handleDeployContract;
var handleSetupContract = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, account, ethAddress, res;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = setupFromStorage(), account = _a.account, ethAddress = _a.ethAddress;
                return [4 /*yield*/, account.functionCall({
                        contractId: account.accountId,
                        methodName: "setup",
                        args: { eth_address: ethAddress },
                        gas: gas,
                    })];
            case 1:
                res = _c.sent();
                if (((_b = res === null || res === void 0 ? void 0 : res.status) === null || _b === void 0 ? void 0 : _b.SuccessValue) !== "") {
                    return [2 /*return*/, alert("account setup failed, please try again")];
                }
                return [4 /*yield*/, (0, exports.handleKeys)()];
            case 2: return [2 /*return*/, _c.sent()];
        }
    });
}); };
exports.handleSetupContract = handleSetupContract;
var handleKeys = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, account, newAccountId, ethAddress, accessKeys, publicKey, actions, res;
    var _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _a = setupFromStorage(), account = _a.account, newAccountId = _a.newAccountId, ethAddress = _a.ethAddress;
                return [4 /*yield*/, account.getAccessKeys()];
            case 1:
                accessKeys = _e.sent();
                // keys are done
                if (accessKeys.length !== 1 || ((_c = (_b = accessKeys[0]) === null || _b === void 0 ? void 0 : _b.access_key) === null || _c === void 0 ? void 0 : _c.permission) !== "FullAccess")
                    return [2 /*return*/];
                publicKey = PublicKey.from(accessKeys[0].public_key);
                actions = [
                    // delete the full access key
                    deleteKey(publicKey),
                    // limited to execute, unlimited allowance
                    addKey(publicKey, functionCallAccessKey(newAccountId, ["execute"], null)),
                ];
                return [4 /*yield*/, account.signAndSendTransaction({
                        receiverId: newAccountId,
                        actions: actions,
                    })];
            case 2:
                res = _e.sent();
                if (((_d = res === null || res === void 0 ? void 0 : res.status) === null || _d === void 0 ? void 0 : _d.SuccessValue) !== "") {
                    console.log("key rotation failed");
                }
                return [4 /*yield*/, (0, exports.handleCheckAccount)(ethAddress)];
            case 3: return [2 /*return*/, _e.sent()];
        }
    });
}); };
exports.handleKeys = handleKeys;
/// waterfall check everything about account and fill in missing pieces
var handleCheckAccount = function (ethAddress) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, newAccountId, newSecretKey, mapAccountId, keyPair, account, state, ethRes, e_4, mapRes, accessKeys;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _a = setupFromStorage(), newAccountId = _a.newAccountId, newSecretKey = _a.newSecretKey;
                return [4 /*yield*/, (0, exports.getNearMap)(ethAddress)];
            case 1:
                mapAccountId = _d.sent();
                if (!mapAccountId) {
                    alert("create account first");
                }
                else {
                    newAccountId = mapAccountId;
                }
                console.log("checking account created");
                return [4 /*yield*/, (0, exports.accountExists)(newAccountId)];
            case 2:
                if (!(_d.sent())) {
                    keyPair = KeyPair.fromString(newSecretKey);
                    return [2 /*return*/, createAccount(newAccountId, keyPair.publicKey.toString())];
                }
                console.log("checking contract deployed");
                account = new Account(connection, newAccountId);
                return [4 /*yield*/, account.state()];
            case 3:
                state = _d.sent();
                if (state.code_hash === "11111111111111111111111111111111") {
                    return [2 /*return*/, (0, exports.handleDeployContract)()];
                }
                console.log("checking contract setup");
                _d.label = 4;
            case 4:
                _d.trys.push([4, 6, , 7]);
                return [4 /*yield*/, account.viewFunction(newAccountId, "get_address")];
            case 5:
                ethRes = _d.sent();
                // any reason the address wasn't set properly
                if (!ethRes || !ethRes.length) {
                    return [2 /*return*/, (0, exports.handleSetupContract)()];
                }
                return [3 /*break*/, 7];
            case 6:
                e_4 = _d.sent();
                // not set at all (wasm error unreachable storage value)
                console.warn(e_4);
                return [2 /*return*/, (0, exports.handleSetupContract)()];
            case 7:
                console.log("checking account address mapping");
                return [4 /*yield*/, account.viewFunction(NETWORK[networkId].MAP_ACCOUNT_ID, "get_eth", {
                        account_id: newAccountId,
                    })];
            case 8:
                mapRes = _d.sent();
                if (mapRes === null) {
                    return [2 /*return*/, (0, exports.handleMapping)(account, ethAddress)];
                }
                console.log("checking access keys");
                return [4 /*yield*/, account.getAccessKeys()];
            case 9:
                accessKeys = _d.sent();
                if (accessKeys.length === 1 && ((_c = (_b = accessKeys[0]) === null || _b === void 0 ? void 0 : _b.access_key) === null || _c === void 0 ? void 0 : _c.permission) === "FullAccess") {
                    return [2 /*return*/, (0, exports.handleKeys)(account)];
                }
                console.log("Success! account created, contract deployed, setup, mapping added, keys rotated");
                return [2 /*return*/, { account: account }];
        }
    });
}); };
exports.handleCheckAccount = handleCheckAccount;
/// on same domain as setup
var hasAppKey = function (accessKeys) {
    return accessKeys.some(function (k) {
        var _a, _b;
        var functionCallPermission = (_b = (_a = k === null || k === void 0 ? void 0 : k.access_key) === null || _a === void 0 ? void 0 : _a.permission) === null || _b === void 0 ? void 0 : _b.FunctionCall;
        return (functionCallPermission.allowance !== null &&
            functionCallPermission.method_names[0] === "execute");
    });
};
exports.hasAppKey = hasAppKey;
var handleRefreshAppKey = function (signer, ethAddress) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, account, accountId, nonce, _b, _c, publicKey, secretKey, public_key, actions, accessKeys, appKeyNonce, _d, oldPublicKey, oldPublicKeyHex, args, res;
    var _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0: return [4 /*yield*/, getUnlimitedKeyAccount(signer, ethAddress)];
            case 1:
                _a = _f.sent(), account = _a.account, accountId = _a.accountId;
                _b = parseInt;
                return [4 /*yield*/, account.viewFunction(accountId, "get_nonce")];
            case 2:
                nonce = _b.apply(void 0, [_f.sent(), 16]).toString();
                return [4 /*yield*/, keyPairFromEthSig(signer, appKeyPayload(accountId, nonce))];
            case 3:
                _c = _f.sent(), publicKey = _c.publicKey, secretKey = _c.secretKey;
                console.log(publicKey);
                public_key = pub2hex(publicKey);
                actions = [
                    {
                        type: "AddKey",
                        public_key: public_key,
                        allowance: parseNearAmount("1"),
                        receiver_id: accountId,
                        method_names: "execute",
                    },
                ];
                return [4 /*yield*/, account.getAccessKeys()];
            case 4:
                accessKeys = _f.sent();
                if (!(0, exports.hasAppKey)(accessKeys)) return [3 /*break*/, 7];
                _d = parseInt;
                return [4 /*yield*/, account.viewFunction(accountId, "get_app_key_nonce")];
            case 5:
                appKeyNonce = _d.apply(void 0, [_f.sent(), 16]).toString();
                return [4 /*yield*/, keyPairFromEthSig(signer, appKeyPayload(accountId, appKeyNonce))];
            case 6:
                oldPublicKey = (_f.sent()).publicKey;
                oldPublicKeyHex = pub2hex(oldPublicKey);
                actions.unshift({
                    type: "DeleteKey",
                    public_key: oldPublicKeyHex,
                });
                _f.label = 7;
            case 7: return [4 /*yield*/, ethSignJson(signer, {
                    nonce: nonce,
                    receivers: [accountId],
                    transactions: [
                        {
                            actions: actions,
                        },
                    ],
                })];
            case 8:
                args = _f.sent();
                return [4 /*yield*/, account.functionCall({
                        contractId: accountId,
                        methodName: "execute",
                        args: args,
                        gas: gas,
                    })];
            case 9:
                res = _f.sent();
                if (((_e = res === null || res === void 0 ? void 0 : res.status) === null || _e === void 0 ? void 0 : _e.SuccessValue) !== "") {
                    return [2 /*return*/, console.warn("app key rotation unsuccessful")];
                }
                del(APP_KEY_SECRET);
                del(APP_KEY_ACCOUNT_ID);
                return [2 /*return*/, { publicKey: public_key, secretKey: secretKey }];
        }
    });
}); };
exports.handleRefreshAppKey = handleRefreshAppKey;
var handleUpdateContract = function (signer, ethAddress) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, account, accountId, contractBytes, _b, actions, nonce, _c, args, res;
    var _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0: return [4 /*yield*/, getUnlimitedKeyAccount(signer, ethAddress)];
            case 1:
                _a = _e.sent(), account = _a.account, accountId = _a.accountId;
                _b = Uint8Array.bind;
                return [4 /*yield*/, fetch(contractPath).then(function (res) { return res.arrayBuffer(); })];
            case 2:
                contractBytes = new (_b.apply(Uint8Array, [void 0, _e.sent()]))();
                actions = [
                    {
                        type: "DeployContract",
                        code: buf2hex(contractBytes),
                    },
                ];
                _c = parseInt;
                return [4 /*yield*/, account.viewFunction(accountId, "get_nonce")];
            case 3:
                nonce = _c.apply(void 0, [_e.sent(), 16]).toString();
                return [4 /*yield*/, ethSignJson(signer, {
                        nonce: nonce,
                        receivers: [accountId],
                        transactions: [
                            {
                                actions: actions,
                            },
                        ],
                    })];
            case 4:
                args = _e.sent();
                return [4 /*yield*/, account.functionCall({
                        contractId: accountId,
                        methodName: "execute",
                        args: args,
                        gas: gas,
                    })];
            case 5:
                res = _e.sent();
                if (((_d = res === null || res === void 0 ? void 0 : res.status) === null || _d === void 0 ? void 0 : _d.SuccessValue) !== "") {
                    return [2 /*return*/, console.warn("redeply contract unsuccessful")];
                }
                return [2 /*return*/];
        }
    });
}); };
exports.handleUpdateContract = handleUpdateContract;
/// account disconnecting flow
var handleDisconnect = function (signer, ethAddress) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, account, accountId, secretKey, _b, seedPhrase, publicKey, newSecretKey, _seedPhrase, oldUnlimitedKey, actions, accessKeys, appKeyNonce, _c, oldPublicKey, oldPublicKeyHex, nonce, _d, args, res, res_1, e_5;
    var _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0: return [4 /*yield*/, getUnlimitedKeyAccount(signer, ethAddress)];
            case 1:
                _a = _g.sent(), account = _a.account, accountId = _a.accountId, secretKey = _a.secretKey;
                _b = (0, near_seed_phrase_1.generateSeedPhrase)(), seedPhrase = _b.seedPhrase, publicKey = _b.publicKey, newSecretKey = _b.secretKey;
                _seedPhrase = window.prompt("Copy this down and keep it safe!!! This is your new seed phrase!!!", seedPhrase);
                if (seedPhrase !== _seedPhrase) {
                    return [2 /*return*/, alert("There was an error, try copying seed phrase again.")];
                }
                oldUnlimitedKey = KeyPair.fromString(secretKey);
                actions = [
                    {
                        type: "DeleteKey",
                        public_key: pub2hex(oldUnlimitedKey.publicKey.toString()),
                    },
                    {
                        type: "AddKey",
                        public_key: pub2hex(publicKey),
                        // special case will add full access key
                        allowance: "0",
                    },
                    {
                        type: "FunctionCall",
                        method_name: "remove_storage",
                        args: "",
                        amount: "0",
                        gas: half_gas,
                    },
                    {
                        type: "DeployContract",
                        code: "",
                    },
                ];
                return [4 /*yield*/, account.getAccessKeys()];
            case 2:
                accessKeys = _g.sent();
                if (!accessKeys.some(function (k) {
                    var _a, _b;
                    var functionCallPermission = (_b = (_a = k === null || k === void 0 ? void 0 : k.access_key) === null || _a === void 0 ? void 0 : _a.permission) === null || _b === void 0 ? void 0 : _b.FunctionCall;
                    return ((functionCallPermission === null || functionCallPermission === void 0 ? void 0 : functionCallPermission.allowance) !== null &&
                        (functionCallPermission === null || functionCallPermission === void 0 ? void 0 : functionCallPermission.method_names[0]) === "execute");
                })) return [3 /*break*/, 5];
                _c = parseInt;
                return [4 /*yield*/, account.viewFunction(accountId, "get_app_key_nonce")];
            case 3:
                appKeyNonce = _c.apply(void 0, [_g.sent(), 16]).toString();
                return [4 /*yield*/, keyPairFromEthSig(signer, appKeyPayload(accountId, appKeyNonce))];
            case 4:
                oldPublicKey = (_g.sent()).publicKey;
                oldPublicKeyHex = pub2hex(oldPublicKey);
                actions.unshift({
                    type: "DeleteKey",
                    public_key: oldPublicKeyHex,
                });
                _g.label = 5;
            case 5:
                _d = parseInt;
                return [4 /*yield*/, account.viewFunction(accountId, "get_nonce")];
            case 6:
                nonce = _d.apply(void 0, [_g.sent(), 16]).toString();
                return [4 /*yield*/, ethSignJson(signer, {
                        nonce: nonce,
                        receivers: [accountId],
                        transactions: [
                            {
                                actions: actions,
                            },
                        ],
                    })];
            case 7:
                args = _g.sent();
                return [4 /*yield*/, account.functionCall({
                        contractId: accountId,
                        methodName: "execute",
                        args: args,
                        gas: gas,
                    })];
            case 8:
                res = _g.sent();
                if (((_e = res === null || res === void 0 ? void 0 : res.status) === null || _e === void 0 ? void 0 : _e.SuccessValue) !== "") {
                    return [2 /*return*/, console.warn("app key rotation unsuccessful")];
                }
                // remove the mapping (can do this later if user has FAK)
                keyStore.setKey(networkId, accountId, newSecretKey);
                _g.label = 9;
            case 9:
                _g.trys.push([9, 11, , 12]);
                return [4 /*yield*/, account.functionCall({
                        contractId: NETWORK[networkId].MAP_ACCOUNT_ID,
                        methodName: "del",
                        args: {},
                        gas: gas,
                    })];
            case 10:
                res_1 = _g.sent();
                console.log(res_1);
                if (((_f = res_1 === null || res_1 === void 0 ? void 0 : res_1.status) === null || _f === void 0 ? void 0 : _f.SuccessValue) !== "") {
                    console.log("account mapping removal failed");
                }
                return [3 /*break*/, 12];
            case 11:
                e_5 = _g.sent();
                console.warn(e_5);
                return [3 /*break*/, 12];
            case 12: return [2 /*return*/, { account: account }];
        }
    });
}); };
exports.handleDisconnect = handleDisconnect;
/// helpers for account creation and connection domain
var setupFromStorage = function (accountId) {
    var newAccountId = accountId || get(ATTEMPT_ACCOUNT_ID);
    var newSecretKey = get(ATTEMPT_SECRET_KEY);
    var ethAddress = get(ATTEMPT_ETH_ADDRESS);
    var account = new Account(connection, newAccountId);
    var keyPair;
    if (newSecretKey) {
        keyPair = KeyPair.fromString(newSecretKey);
        keyStore.setKey(networkId, newAccountId, keyPair);
    }
    return { newAccountId: newAccountId, newSecretKey: newSecretKey, ethAddress: ethAddress, account: account, keyPair: keyPair };
};
var getUnlimitedKeyAccount = function (signer, ethAddress) { return __awaiter(void 0, void 0, void 0, function () {
    var accountId, secretKey, _secretKey, account, keyPair;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                secretKey = get(ATTEMPT_SECRET_KEY);
                if (!!secretKey) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, exports.getNearMap)(ethAddress)];
            case 1:
                // TODO remove dep on near-utils
                // use any random near account to check mapping
                accountId = _a.sent();
                return [4 /*yield*/, keyPairFromEthSig(signer, unlimitedKeyPayload(accountId, ethAddress))];
            case 2:
                _secretKey = (_a.sent()).secretKey;
                secretKey = _secretKey;
                return [3 /*break*/, 4];
            case 3:
                accountId = get(ATTEMPT_ACCOUNT_ID);
                _a.label = 4;
            case 4:
                account = new Account(connection, accountId);
                keyPair = KeyPair.fromString(secretKey);
                keyStore.setKey(networkId, accountId, keyPair);
                return [2 /*return*/, { account: account, accountId: accountId, secretKey: secretKey }];
        }
    });
}); };
/**
 * The access key payloads, unlimited and limited
 */
var appKeyPayload = function (accountId, appKeyNonce) { return ({
    WARNING: "Creating key for: ".concat(accountId),
    nonce: appKeyNonce,
    description: "ONLY sign this on apps you trust! This key CAN use up to 1 N for transactions.",
}); };
var unlimitedKeyPayload = function (accountId) { return ({
    WARNING: "ACCESS TO NEAR ACCOUNT: ".concat(accountId),
    description: "ONLY sign on this website: ".concat("https://example.com"),
}); };
/**
 * main domain, types and eth signTypedData method
 */
var domain = {
    name: "NETH",
    version: "1",
    // chainId: 1, // aurora
    chainId: 1313161554, // aurora
};
var HEADER_OFFSET = "NETH";
var HEADER_PAD = 8;
var RECEIVER_MARKER = "|~-_NETH~-_-~RECEIVER_-~|";
var PREFIX = "|NETH_";
var SUFFIX = "_NETH|";
var pack = function (elements) {
    return elements
        .map(function (el) {
        var str = typeof el === "string"
            ? el
            : Object.entries(el)
                .map(function (_a) {
                var k = _a[0], v = _a[1];
                return "".concat(PREFIX).concat(k, ":").concat(typeof v === "string" ? v : JSON.stringify(v)).concat(SUFFIX);
            })
                .join("");
        var len = str.length.toString().padStart(HEADER_PAD, "0");
        return HEADER_OFFSET + len + "__" + str;
    })
        .join("");
};
var ethSignJson = function (signer, json) { return __awaiter(void 0, void 0, void 0, function () {
    var types, numReceivers, sig, args;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                types = {
                    Transaction: [],
                };
                Object.entries(json).forEach(function (_a) {
                    var k = _a[0], v = _a[1];
                    types.Transaction.push({
                        type: "string",
                        name: k,
                    });
                });
                /// convenience for devs so they can pass in JSON
                /// hoist any functionCall args containing receiver|account in their key to top level receivers
                /// replaces value with marker, contract fills in marker
                if (json.transactions) {
                    Object.values(json.transactions).forEach(function (tx, i) {
                        tx.actions.forEach(function (action) {
                            if (!action.args)
                                return;
                            Object.entries(action.args).forEach(function (_a) {
                                /// TODO include check on value to determine valid account_id to be replaced
                                var key = _a[0], value = _a[1];
                                if (/receiver_id|account_id/g.test(key)) {
                                    action.args[key] = RECEIVER_MARKER;
                                    json.receivers.splice(i + 1, 0, value);
                                }
                            });
                        });
                    });
                    json.transactions = pack(json.transactions.map(function (_a) {
                        var actions = _a.actions;
                        return pack(actions);
                    }));
                }
                if (json.receivers) {
                    numReceivers = json.receivers.length.toString();
                    json.receivers =
                        HEADER_OFFSET +
                            json.receivers.join(",").length.toString().padStart(HEADER_PAD, "0") +
                            "__" +
                            json.receivers.join(",");
                    json.receivers =
                        json.receivers.substring(0, 4) + numReceivers.padStart(3, "0") + json.receivers.substring(7);
                }
                return [4 /*yield*/, signer._signTypedData(domain, types, json)];
            case 1:
                sig = _a.sent();
                args = {
                    sig: sig,
                    msg: json,
                };
                // console.log('\nargs\n', JSON.stringify(args, null, 4), '\n');
                return [2 /*return*/, args];
        }
    });
}); };
var keyPairFromEthSig = function (signer, json) { return __awaiter(void 0, void 0, void 0, function () {
    var sig, sigHash;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, ethSignJson(signer, json)];
            case 1:
                sig = (_a.sent()).sig;
                sigHash = ethers_1.ethers.utils.id(sig);
                /// use 32 bytes of entropy from hash of signature to create NEAR keyPair
                return [2 /*return*/, (0, near_seed_phrase_1.generateSeedPhrase)(sigHash.substring(2, 34))];
        }
    });
}); };
/**
 * Used by apps to signIn and signAndSendTransactions
 */
/// ethereum
var getEthereum = function () { return __awaiter(void 0, void 0, void 0, function () {
    var provider, accounts, signer;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: "0x" + domain.chainId.toString(16) }],
                })];
            case 1:
                _b.sent();
                provider = new ethers_1.ethers.providers.Web3Provider(window.ethereum);
                return [4 /*yield*/, provider.listAccounts()];
            case 2:
                accounts = _b.sent();
                if (!(accounts.length === 0)) return [3 /*break*/, 4];
                return [4 /*yield*/, provider.send("eth_requestAccounts", [])];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4:
                signer = provider.getSigner();
                _a = { signer: signer };
                return [4 /*yield*/, signer.getAddress()];
            case 5: return [2 /*return*/, (_a.ethAddress = _b.sent(), _a)];
        }
    });
}); };
exports.getEthereum = getEthereum;
var switchEthereum = function () { return __awaiter(void 0, void 0, void 0, function () {
    var provider;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                provider = new ethers_1.ethers.providers.Web3Provider(window.ethereum);
                return [4 /*yield*/, provider.send("wallet_requestPermissions", [{ eth_accounts: {} }])];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.switchEthereum = switchEthereum;
/// near
var getNearMap = function (ethAddress) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, contractAccount.viewFunction(NETWORK[networkId].MAP_ACCOUNT_ID, "get_near", { eth_address: ethAddress })];
    });
}); };
exports.getNearMap = getNearMap;
var getNear = function () { return __awaiter(void 0, void 0, void 0, function () {
    var secretKey, accountId, _a, account, keyPair;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                secretKey = get(APP_KEY_SECRET);
                accountId = get(APP_KEY_ACCOUNT_ID);
                if (!(!secretKey || !accountId)) return [3 /*break*/, 4];
                _a = exports.getAppKey;
                return [4 /*yield*/, (0, exports.getEthereum)()];
            case 1: return [4 /*yield*/, _a.apply(void 0, [_b.sent()])];
            case 2:
                _b.sent();
                return [4 /*yield*/, (0, exports.getNear)()];
            case 3: return [2 /*return*/, _b.sent()];
            case 4:
                account = new Account(connection, accountId);
                keyPair = KeyPair.fromString(secretKey);
                keyStore.setKey(networkId, accountId, keyPair);
                return [2 /*return*/, { account: account, accountId: accountId, keyPair: keyPair, secretKey: secretKey }];
        }
    });
}); };
exports.getNear = getNear;
exports.signIn = exports.getNear;
var signOut = function () { return __awaiter(void 0, void 0, void 0, function () {
    var accountId;
    return __generator(this, function (_a) {
        accountId = get(APP_KEY_ACCOUNT_ID);
        if (!accountId) {
            return [2 /*return*/, console.warn("already signed out")];
        }
        del(APP_KEY_SECRET);
        del(APP_KEY_ACCOUNT_ID);
        return [2 /*return*/, { accountId: accountId }];
    });
}); };
exports.signOut = signOut;
var isSignedIn = function () {
    return !!get(APP_KEY_SECRET) || !!get(APP_KEY_ACCOUNT_ID);
};
exports.isSignedIn = isSignedIn;
var promptValidAccountId = function (msg) { return __awaiter(void 0, void 0, void 0, function () {
    var newAccountId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                newAccountId = window.prompt(msg);
                if (!newAccountId) {
                    throw new Error("NETH Error: failed to pick valid NEAR account name");
                }
                if (newAccountId.length < 2 ||
                    newAccountId.indexOf(".") > -1 ||
                    !ACCOUNT_REGEX.test(newAccountId) ||
                    newAccountId.length > 64) {
                    return [2 /*return*/, promptValidAccountId("account is invalid (a-z, 0-9 and -,_ only; min 2; max 64; ".concat(accountSuffix, " applied automatically)"))];
                }
                return [4 /*yield*/, (0, exports.accountExists)(newAccountId)];
            case 1:
                if (_a.sent()) {
                    return [2 /*return*/, promptValidAccountId("account already exists")];
                }
                return [2 /*return*/, newAccountId];
        }
    });
}); };
var getAppKey = function (_a) {
    var signer = _a.signer, eth_address = _a.ethAddress;
    return __awaiter(void 0, void 0, void 0, function () {
        var accountId, newAccountId, account_1, appKeyNonce, _b, _c, publicKey, secretKey, account, accessKeys, keyPair;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, (0, exports.getNearMap)(eth_address)];
                case 1:
                    accountId = _d.sent();
                    if (!!accountId) return [3 /*break*/, 4];
                    return [4 /*yield*/, promptValidAccountId("The Ethereum address ".concat(eth_address, " is not connected to a NEAR account yet. Select a NEAR account name and we'll create and connect one for you."))];
                case 2:
                    newAccountId = _d.sent();
                    return [4 /*yield*/, (0, exports.handleCreate)(signer, eth_address, newAccountId + accountSuffix)];
                case 3:
                    account_1 = (_d.sent()).account;
                    accountId = account_1.accountId;
                    _d.label = 4;
                case 4:
                    _b = parseInt;
                    return [4 /*yield*/, contractAccount.viewFunction(accountId, "get_app_key_nonce")];
                case 5:
                    appKeyNonce = _b.apply(void 0, [_d.sent(), 16]).toString();
                    return [4 /*yield*/, keyPairFromEthSig(signer, appKeyPayload(accountId, appKeyNonce))];
                case 6:
                    _c = _d.sent(), publicKey = _c.publicKey, secretKey = _c.secretKey;
                    account = new Account(connection, accountId);
                    return [4 /*yield*/, account.getAccessKeys()];
                case 7:
                    accessKeys = _d.sent();
                    if (!!(0, exports.hasAppKey)(accessKeys)) return [3 /*break*/, 9];
                    return [4 /*yield*/, (0, exports.handleRefreshAppKey)(signer, eth_address)];
                case 8:
                    _d.sent();
                    _d.label = 9;
                case 9:
                    keyPair = KeyPair.fromString(secretKey);
                    keyStore.setKey(networkId, accountId, keyPair);
                    set(APP_KEY_SECRET, secretKey);
                    set(APP_KEY_ACCOUNT_ID, account.accountId);
                    return [2 /*return*/, { publicKey: publicKey, secretKey: secretKey, account: account }];
            }
        });
    });
};
exports.getAppKey = getAppKey;
var signAndSendTransactions = function (_a) {
    var transactions = _a.transactions;
    return __awaiter(void 0, void 0, void 0, function () {
        var signer, _b, account, accountId, receivers, transformedTxs, nonce, _c, args, res;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, (0, exports.getEthereum)()];
                case 1:
                    signer = (_d.sent()).signer;
                    return [4 /*yield*/, (0, exports.getNear)()];
                case 2:
                    _b = _d.sent(), account = _b.account, accountId = _b.accountId;
                    receivers = transactions.map(function (_a) {
                        var receiverId = _a.receiverId;
                        return receiverId;
                    });
                    transformedTxs = transactions.map(function (_a) {
                        var receiverId = _a.receiverId, actions = _a.actions;
                        return ({
                            actions: (0, exports.convertActions)(actions, accountId, receiverId),
                        });
                    });
                    _c = parseInt;
                    return [4 /*yield*/, account.viewFunction(accountId, "get_nonce")];
                case 3:
                    nonce = _c.apply(void 0, [_d.sent(), 16]).toString();
                    return [4 /*yield*/, ethSignJson(signer, {
                            nonce: nonce,
                            receivers: receivers,
                            transactions: transformedTxs,
                        })];
                case 4:
                    args = _d.sent();
                    return [4 /*yield*/, account.functionCall({
                            contractId: accountId,
                            methodName: "execute",
                            args: args,
                            gas: gas,
                        })];
                case 5:
                    res = _d.sent();
                    return [2 /*return*/, res];
            }
        });
    });
};
exports.signAndSendTransactions = signAndSendTransactions;
/// helpers
var convertActions = function (actions, accountId, receiverId) {
    return actions.map(function (_action) {
        var type = _action.enum;
        var _a = _action[type] || _action, gas = _a.gas, publicKey = _a.publicKey, methodName = _a.methodName, args = _a.args, deposit = _a.deposit, accessKey = _a.accessKey, code = _a.code;
        var action = {
            type: (type && type[0].toUpperCase() + type.substr(1)) || "FunctionCall",
            gas: (gas && gas.toString()) || undefined,
            public_key: (publicKey && pub2hex(publicKey)) || undefined,
            method_name: methodName,
            args: args || undefined,
            code: code || undefined,
            amount: (deposit && deposit.toString()) || undefined,
            permission: undefined,
        };
        Object.keys(action).forEach(function (k) {
            if (action[k] === undefined)
                delete action[k];
        });
        if (accessKey) {
            if (receiverId === accountId) {
                action.allowance = parseNearAmount("1");
                action.method_names = "execute";
                action.receiver_id = accountId;
            }
            else if (accessKey.permission.enum === "functionCall") {
                var _b = accessKey.permission.functionCall, receiverId_1 = _b.receiverId, methodNames = _b.methodNames, allowance = _b.allowance;
                action.receiver_id = receiverId_1;
                action.allowance = (allowance && allowance.toString()) || parseNearAmount("0.25");
                action.method_names = methodNames.join(",");
            }
        }
        return action;
    });
};
exports.convertActions = convertActions;
