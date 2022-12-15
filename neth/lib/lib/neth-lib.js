"use strict";
/*eslint @typescript-eslint/no-use-before-define: 1*/
/*eslint @typescript-eslint/no-explicit-any: 1*/
/*eslint @typescript-eslint/naming-convention: 1*/
// @ts-nocheck
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
exports.convertActions = exports.signAndSendTransactions = exports.getAppKey = exports.isSignedIn = exports.verifyOwner = exports.signOut = exports.signIn = exports.getNear = exports.getNearMap = exports.switchEthereum = exports.getEthereum = exports.handleDisconnect = exports.handleUpdateContract = exports.handleRefreshAppKey = exports.hasAppKey = exports.handleCheckAccount = exports.handleKeys = exports.handleSetupContract = exports.handleDeployContract = exports.handleMapping = exports.handleCancelFunding = exports.handleCreate = exports.accountExists = exports.getConnection = exports.initConnection = exports.MIN_NEW_ACCOUNT_ASK = exports.PREV_NETH_SITE_URL = exports.NETH_SITE_URL = void 0;
var ethers_1 = require("ethers");
var detect_provider_1 = __importDefault(require("@metamask/detect-provider"));
var nearAPI = __importStar(require("near-api-js"));
var near_seed_phrase_1 = require("near-seed-phrase");
var bn_js_1 = __importDefault(require("bn.js"));
var Near = nearAPI.Near, Account = nearAPI.Account, KeyPair = nearAPI.KeyPair, BrowserLocalStorageKeyStore = nearAPI.keyStores.BrowserLocalStorageKeyStore, _a = nearAPI.transactions, addKey = _a.addKey, deleteKey = _a.deleteKey, functionCallAccessKey = _a.functionCallAccessKey, _b = nearAPI.utils, PublicKey = _b.PublicKey, parseNearAmount = _b.format.parseNearAmount;
exports.NETH_SITE_URL = "https://neth.app";
exports.PREV_NETH_SITE_URL = "neardefi.github.io/neth";
var NETWORK = {
    testnet: {
        FUNDING_ACCOUNT_ID: "neth.testnet",
        MAP_ACCOUNT_ID: "map.neth.testnet",
        ROOT_ACCOUNT_ID: "testnet",
    },
    mainnet: {
        MAP_ACCOUNT_ID: "nethmap.near",
        ROOT_ACCOUNT_ID: "near",
    },
};
var WS_STORAGE_NAMESPACE = "near-wallet-selector:neth:";
var REFRESH_MSG = "Please refresh the page and try again.";
var TX_ARGS_ATTEMPT = "__TX_ARGS_ATTEMPT";
var ATTEMPT_SECRET_KEY = "__ATTEMPT_SECRET_KEY";
var ATTEMPT_ACCOUNT_ID = "__ATTEMPT_ACCOUNT_ID";
var ATTEMPT_ETH_ADDRESS = "__ATTEMPT_ETH_ADDRESS";
var APP_KEY_SECRET = "__APP_KEY_SECRET";
var APP_KEY_ACCOUNT_ID = "__APP_KEY_ACCOUNT_ID";
var defaultGas = "200000000000000";
var halfGas = "50000000000000";
/// this is the new account amount 0.21 for account name, keys, contract and 0.01 for mapping contract storage cost
var MIN_NEW_ACCOUNT = parseNearAmount("0.4");
var MIN_NEW_ACCOUNT_THRESH = parseNearAmount("0.49");
exports.MIN_NEW_ACCOUNT_ASK = parseNearAmount("0.5");
var FUNDING_CHECK_TIMEOUT = 5000;
/// lkmfawl
var attachedDepositMapping = parseNearAmount("0.05");
/// Helpers
var defaultStorage = function (prefix) {
    if (prefix === void 0) { prefix = ""; }
    return ({
        getItem: function (k) {
            var v = localStorage.getItem(prefix + k);
            if ((v === null || v === void 0 ? void 0 : v.charAt(0)) !== "{") {
                return v;
            }
            try {
                return JSON.parse(v);
            }
            catch (e) {
                //   logger.log(e);
            }
        },
        setItem: function (k, v) {
            return localStorage.setItem(prefix + k, typeof v === "string" ? v : JSON.stringify(v));
        },
        removeItem: function (k) { return localStorage.removeItem(prefix + k); },
    });
};
var defaultLogger = function () { return ({
    // eslint-disable-next-line
    log: function (args) { return console.log.apply(console, args); },
}); };
/// NEAR setup
var near, gas, keyStore, logger, storage, connection, networkId, contractAccount, accountSuffix;
var initConnection = function (_a) {
    var network = _a.network, _b = _a.gas, _gas = _b === void 0 ? defaultGas : _b, _c = _a.logger, _logger = _c === void 0 ? defaultLogger() : _c, _d = _a.storage, _storage = _d === void 0 ? defaultStorage() : _d;
    gas = _gas;
    logger = _logger;
    storage = _storage;
    keyStore = new BrowserLocalStorageKeyStore();
    near = new Near(__assign(__assign({}, network), { deps: { keyStore: keyStore } }));
    connection = near.connection;
    networkId = network.networkId;
    contractAccount = new Account(connection, networkId === "mainnet" ? "near" : networkId);
    accountSuffix = networkId === "mainnet" ? ".near" : "." + networkId;
    var cover = document.createElement("div");
    cover.style.display = "none";
    cover.style.width = "100%";
    cover.style.height = "100vh";
    cover.style.zIndex = "999999";
    cover.style.position = "fixed";
    cover.style.top = "0";
    cover.style.background = "rgba(0, 0, 0, 0.5)";
    document.body.appendChild(cover);
    /// recovery from unbundled TXs that haven't been broadcast yet
    broadcastTXs();
    return cover;
};
exports.initConnection = initConnection;
var getConnection = function () {
    return {
        near: near,
        connection: connection,
        keyStore: keyStore,
        networkId: networkId,
        contractAccount: contractAccount,
        accountSuffix: accountSuffix,
    };
};
exports.getConnection = getConnection;
/// helpers
var accountExists = function (accountId, ethAddress) {
    if (ethAddress === void 0) { ethAddress = null; }
    return __awaiter(void 0, void 0, void 0, function () {
        var account, mapAccountId, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    account = new nearAPI.Account(connection, accountId);
                    return [4 /*yield*/, account.state()];
                case 1:
                    _a.sent();
                    if (!ethAddress) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, exports.getNearMap)(ethAddress)];
                case 2:
                    mapAccountId = _a.sent();
                    if (mapAccountId) {
                        return [2 /*return*/, true];
                    }
                    _a.label = 3;
                case 3: return [2 /*return*/, true];
                case 4:
                    e_1 = _a.sent();
                    if (!/no such file|does not exist/.test(e_1.toString())) {
                        throw e_1;
                    }
                    return [2 /*return*/, false];
                case 5: return [2 /*return*/];
            }
        });
    });
};
exports.accountExists = accountExists;
var buf2hex = function (buf) { return ethers_1.ethers.utils.hexlify(buf).substring(2); };
var pub2hex = function (publicKey) {
    return ethers_1.ethers.utils.hexlify(PublicKey.fromString(publicKey).data).substring(2);
};
/// account creation and connection flow
var handleCreate = function (signer, ethAddress, newAccountId, fundingAccountCB, fundingErrorCB, postFundingCB) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, fundingAccountPubKey, new_secret_key;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if ((networkId === "testnet" && newAccountId.indexOf(".near") > -1) ||
                    (networkId === "mainnet" && newAccountId.indexOf(".testnet") > -1)) {
                    return [2 /*return*/, alert("Invalid account name. You do not need to add any .near or .testnet. Please try again.")];
                }
                return [4 /*yield*/, keyPairFromEthSig(signer, fundingKeyPayload())];
            case 1:
                _a = _b.sent(), fundingAccountPubKey = _a.publicKey, new_secret_key = _a.secretKey;
                /// store attempt in localStorage so we can recover and retry / resume contract deployment
                return [4 /*yield*/, storage.setItem(ATTEMPT_ACCOUNT_ID, newAccountId)];
            case 2:
                /// store attempt in localStorage so we can recover and retry / resume contract deployment
                _b.sent();
                return [4 /*yield*/, storage.setItem(ATTEMPT_SECRET_KEY, new_secret_key)];
            case 3:
                _b.sent();
                return [4 /*yield*/, storage.setItem(ATTEMPT_ETH_ADDRESS, ethAddress)];
            case 4:
                _b.sent();
                return [4 /*yield*/, createAccount({
                        signer: signer,
                        newAccountId: newAccountId,
                        fundingAccountPubKey: fundingAccountPubKey,
                        fundingAccountCB: fundingAccountCB,
                        fundingErrorCB: fundingErrorCB,
                        postFundingCB: postFundingCB,
                    })];
            case 5: return [2 /*return*/, _b.sent()];
        }
    });
}); };
exports.handleCreate = handleCreate;
var createAccount = function (_a) {
    var signer = _a.signer, newAccountId = _a.newAccountId, fundingAccountPubKey = _a.fundingAccountPubKey, fundingAccountCB = _a.fundingAccountCB, fundingErrorCB = _a.fundingErrorCB, postFundingCB = _a.postFundingCB;
    return __awaiter(void 0, void 0, void 0, function () {
        var implicitAccountId, checkImplicitFunded, _b, account, ethAddress, _c, new_public_key, new_secret_key, e_2;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    implicitAccountId = Buffer.from(PublicKey.from(fundingAccountPubKey).data).toString("hex");
                    if (fundingAccountCB) {
                        fundingAccountCB(implicitAccountId);
                    }
                    checkImplicitFunded = function () { return __awaiter(void 0, void 0, void 0, function () {
                        var account, balance, available, diff, e_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    logger.log("checking for funding of implicit account", implicitAccountId);
                                    account = new Account(connection, implicitAccountId);
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 6, , 9]);
                                    return [4 /*yield*/, account.getAccountBalance()];
                                case 2:
                                    balance = _a.sent();
                                    available = balance.available;
                                    diff = new bn_js_1.default(available).sub(new bn_js_1.default(MIN_NEW_ACCOUNT_THRESH));
                                    if (!diff.lt(new bn_js_1.default("0"))) return [3 /*break*/, 5];
                                    // alert(`There is not enough NEAR (${formatNearAmount(MIN_NEW_ACCOUNT_ASK, 4)} minimum) to create a new account and deploy NETH contract. Please deposit more and try again.`)
                                    if (fundingErrorCB) {
                                        fundingErrorCB(implicitAccountId, diff.abs().toString());
                                    }
                                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, FUNDING_CHECK_TIMEOUT); })];
                                case 3:
                                    _a.sent();
                                    return [4 /*yield*/, checkImplicitFunded()];
                                case 4: return [2 /*return*/, _a.sent()];
                                case 5: return [3 /*break*/, 9];
                                case 6:
                                    e_3 = _a.sent();
                                    if (!/does not exist/gi.test(e_3.toString())) {
                                        throw e_3;
                                    }
                                    logger.log("not funded, checking again");
                                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, FUNDING_CHECK_TIMEOUT); })];
                                case 7:
                                    _a.sent();
                                    return [4 /*yield*/, checkImplicitFunded()];
                                case 8: return [2 /*return*/, _a.sent()];
                                case 9: return [2 /*return*/, true];
                            }
                        });
                    }); };
                    return [4 /*yield*/, checkImplicitFunded()];
                case 1:
                    /// if not funded properly, return and reload
                    if (!(_d.sent())) {
                        return [2 /*return*/, window.location.reload()];
                    }
                    logger.log("implicit account funded", implicitAccountId);
                    if (postFundingCB) {
                        postFundingCB();
                    }
                    return [4 /*yield*/, setupFromStorage(implicitAccountId)];
                case 2:
                    _b = _d.sent(), account = _b.account, ethAddress = _b.ethAddress;
                    return [4 /*yield*/, (0, exports.accountExists)(newAccountId, ethAddress)];
                case 3:
                    if (!_d.sent()) return [3 /*break*/, 5];
                    alert("".concat(newAccountId, " already exists. Please try another."));
                    return [4 /*yield*/, (0, exports.handleCancelFunding)(implicitAccountId)];
                case 4: return [2 /*return*/, _d.sent()];
                case 5: return [4 /*yield*/, keyPairFromEthSig(signer, unlimitedKeyPayload(newAccountId, ethAddress))];
                case 6:
                    _c = _d.sent(), new_public_key = _c.publicKey, new_secret_key = _c.secretKey;
                    return [4 /*yield*/, storage.setItem(ATTEMPT_SECRET_KEY, new_secret_key)];
                case 7:
                    _d.sent();
                    // remove any existing app key
                    return [4 /*yield*/, storage.removeItem(APP_KEY_ACCOUNT_ID)];
                case 8:
                    // remove any existing app key
                    _d.sent();
                    return [4 /*yield*/, storage.removeItem(APP_KEY_SECRET)];
                case 9:
                    _d.sent();
                    _d.label = 10;
                case 10:
                    _d.trys.push([10, 12, , 13]);
                    return [4 /*yield*/, account.functionCall({
                            contractId: NETWORK[networkId].ROOT_ACCOUNT_ID,
                            methodName: "create_account",
                            args: {
                                new_account_id: newAccountId,
                                new_public_key: new_public_key,
                            },
                            gas: gas,
                            attachedDeposit: new bn_js_1.default(MIN_NEW_ACCOUNT),
                        })];
                case 11:
                    _d.sent();
                    return [3 /*break*/, 13];
                case 12:
                    e_2 = _d.sent();
                    if (!/be created by/.test(JSON.stringify(e_2))) {
                        throw e_2;
                    }
                    return [2 /*return*/, (0, exports.handleCancelFunding)(implicitAccountId)];
                case 13: return [4 /*yield*/, (0, exports.accountExists)(newAccountId)];
                case 14:
                    /// check
                    if (!(_d.sent())) {
                        return [2 /*return*/, logger.log("Account ".concat(newAccountId, " could NOT be created. Please refresh the page and try again."))];
                    }
                    logger.log("Account ".concat(newAccountId, " created successfully."));
                    /// drain implicit
                    return [4 /*yield*/, account.deleteAccount(newAccountId)];
                case 15:
                    /// drain implicit
                    _d.sent();
                    return [4 /*yield*/, (0, exports.handleMapping)()];
                case 16: return [2 /*return*/, _d.sent()];
            }
        });
    });
};
var handleCancelFunding = function (fundingAccountId) { return __awaiter(void 0, void 0, void 0, function () {
    var account, refundAccountId, e_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, setupFromStorage(fundingAccountId)];
            case 1:
                account = (_a.sent()).account;
                refundAccountId = window.prompt("There was an error creating the account. You need to refund and try again. Please enter the account you funded from. MAKE SURE IT IS CORRECT. THIS CANNOT BE UNDONE.");
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, 5, 9]);
                return [4 /*yield*/, account.deleteAccount(refundAccountId)];
            case 3:
                _a.sent();
                return [3 /*break*/, 9];
            case 4:
                e_4 = _a.sent();
                logger.log("Cannot delete implicit");
                return [3 /*break*/, 9];
            case 5: 
            /// delete attempt
            return [4 /*yield*/, storage.removeItem(ATTEMPT_ACCOUNT_ID)];
            case 6:
                /// delete attempt
                _a.sent();
                return [4 /*yield*/, storage.removeItem(ATTEMPT_SECRET_KEY)];
            case 7:
                _a.sent();
                return [4 /*yield*/, storage.removeItem(ATTEMPT_ETH_ADDRESS)];
            case 8:
                _a.sent();
                return [7 /*endfinally*/];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.handleCancelFunding = handleCancelFunding;
var handleMapping = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, account, ethAddress, e_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setupFromStorage()];
            case 1:
                _a = _b.sent(), account = _a.account, ethAddress = _a.ethAddress;
                _b.label = 2;
            case 2:
                _b.trys.push([2, 4, , 5]);
                return [4 /*yield*/, account.functionCall({
                        contractId: NETWORK[networkId].MAP_ACCOUNT_ID,
                        methodName: "set",
                        args: { eth_address: ethAddress },
                        gas: gas,
                        attachedDeposit: new bn_js_1.default(attachedDepositMapping),
                    })];
            case 3:
                _b.sent();
                logger.log("Account mapping successful");
                return [3 /*break*/, 5];
            case 4:
                e_5 = _b.sent();
                logger.log(e_5);
                return [2 /*return*/, logger.log("Account mapping failed")];
            case 5: return [4 /*yield*/, (0, exports.handleDeployContract)()];
            case 6: return [2 /*return*/, _b.sent()];
        }
    });
}); };
exports.handleMapping = handleMapping;
var handleDeployContract = function () { return __awaiter(void 0, void 0, void 0, function () {
    var account, contractPath, ab, contractBytes, e_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, setupFromStorage()];
            case 1:
                account = (_a.sent()).account;
                contractPath = window === null || window === void 0 ? void 0 : window.contractPath;
                return [4 /*yield*/, fetch(contractPath).then(function (res) {
                        return res.arrayBuffer();
                    })];
            case 2:
                ab = _a.sent();
                contractBytes = new Uint8Array(ab);
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, account.deployContract(contractBytes)];
            case 4:
                _a.sent();
                logger.log("Contract deployed successfully.");
                return [3 /*break*/, 6];
            case 5:
                e_6 = _a.sent();
                logger.log(e_6);
                return [2 /*return*/, logger.log("Contract deployment failed. ".concat(REFRESH_MSG))];
            case 6: return [4 /*yield*/, (0, exports.handleSetupContract)()];
            case 7: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.handleDeployContract = handleDeployContract;
var handleSetupContract = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, account, ethAddress, e_7;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, setupFromStorage()];
            case 1:
                _a = _b.sent(), account = _a.account, ethAddress = _a.ethAddress;
                _b.label = 2;
            case 2:
                _b.trys.push([2, 4, , 5]);
                return [4 /*yield*/, account.functionCall({
                        contractId: account.accountId,
                        methodName: "setup",
                        args: { eth_address: ethAddress },
                        gas: gas,
                    })];
            case 3:
                _b.sent();
                logger.log("Contract setup successfully.");
                return [3 /*break*/, 5];
            case 4:
                e_7 = _b.sent();
                logger.log(e_7);
                return [2 /*return*/, logger.log("Contract setup failed. ".concat(REFRESH_MSG))];
            case 5: return [4 /*yield*/, (0, exports.handleKeys)()];
            case 6: return [2 /*return*/, _b.sent()];
        }
    });
}); };
exports.handleSetupContract = handleSetupContract;
var handleKeys = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, account, newAccountId, ethAddress, accessKeys, publicKey, actions, res, e_8;
    var _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0: return [4 /*yield*/, setupFromStorage()];
            case 1:
                _a = _e.sent(), account = _a.account, newAccountId = _a.newAccountId, ethAddress = _a.ethAddress;
                return [4 /*yield*/, account.getAccessKeys()];
            case 2:
                accessKeys = _e.sent();
                // keys are done
                if (accessKeys.length !== 1 ||
                    ((_c = (_b = accessKeys[0]) === null || _b === void 0 ? void 0 : _b.access_key) === null || _c === void 0 ? void 0 : _c.permission) !== "FullAccess") {
                    return [2 /*return*/];
                }
                publicKey = PublicKey.from(accessKeys[0].public_key);
                actions = [
                    // delete the full access key
                    deleteKey(publicKey),
                    // limited to execute, unlimited allowance
                    addKey(publicKey, functionCallAccessKey(newAccountId, ["execute"])),
                ];
                _e.label = 3;
            case 3:
                _e.trys.push([3, 5, , 6]);
                return [4 /*yield*/, account.signAndSendTransaction({
                        receiverId: newAccountId,
                        actions: actions,
                    })];
            case 4:
                res = _e.sent();
                if (((_d = res === null || res === void 0 ? void 0 : res.status) === null || _d === void 0 ? void 0 : _d.SuccessValue) !== "") {
                    return [2 /*return*/, logger.log("Key rotation failed. ".concat(REFRESH_MSG))];
                }
                logger.log("Key rotation successful.");
                return [3 /*break*/, 6];
            case 5:
                e_8 = _e.sent();
                logger.log(e_8);
                return [2 /*return*/, logger.log("Key rotation failed. ".concat(REFRESH_MSG))];
            case 6: return [4 /*yield*/, (0, exports.handleCheckAccount)({ ethAddress: ethAddress })];
            case 7: return [2 /*return*/, _e.sent()];
        }
    });
}); };
exports.handleKeys = handleKeys;
/// waterfall check everything about account and fill in missing pieces
var handleCheckAccount = function (_a) {
    var _b = _a.signer, signer = _b === void 0 ? null : _b, _c = _a.ethAddress, ethAddress = _c === void 0 ? null : _c, _d = _a.fundingAccountCB, fundingAccountCB = _d === void 0 ? null : _d, _e = _a.fundingErrorCB, fundingErrorCB = _e === void 0 ? null : _e, _f = _a.postFundingCB, postFundingCB = _f === void 0 ? null : _f;
    return __awaiter(void 0, void 0, void 0, function () {
        var setup, newAccountId, newSecretKey, mapAccountId, keyPair, account, mapRes, state, ethRes, e_9, accessKeys;
        var _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0: return [4 /*yield*/, setupFromStorage()];
                case 1:
                    setup = _j.sent();
                    newAccountId = setup.newAccountId;
                    newSecretKey = setup.newSecretKey;
                    return [4 /*yield*/, (0, exports.getNearMap)(ethAddress)];
                case 2:
                    mapAccountId = _j.sent();
                    if (!mapAccountId) {
                        // alert("create account first");
                        logger.log("No account mapping exists.");
                    }
                    else {
                        newAccountId = mapAccountId;
                    }
                    logger.log("Checking account created.");
                    return [4 /*yield*/, (0, exports.accountExists)(newAccountId)];
                case 3:
                    if (!(_j.sent())) {
                        keyPair = KeyPair.fromString(newSecretKey);
                        return [2 /*return*/, createAccount({
                                signer: signer,
                                newAccountId: newAccountId,
                                fundingAccountPubKey: keyPair.getPublicKey().toString(),
                                fundingAccountCB: fundingAccountCB,
                                fundingErrorCB: fundingErrorCB,
                                postFundingCB: postFundingCB,
                            })];
                    }
                    account = new Account(connection, newAccountId);
                    logger.log("Checking account address mapping.");
                    return [4 /*yield*/, account.viewFunction(NETWORK[networkId].MAP_ACCOUNT_ID, "get_eth", {
                            account_id: newAccountId,
                        })];
                case 4:
                    mapRes = _j.sent();
                    if (mapRes === null) {
                        return [2 /*return*/, (0, exports.handleMapping)()];
                    }
                    logger.log("Checking contract deployed.");
                    return [4 /*yield*/, account.state()];
                case 5:
                    state = _j.sent();
                    if (state.code_hash === "11111111111111111111111111111111") {
                        return [2 /*return*/, (0, exports.handleDeployContract)()];
                    }
                    logger.log("Checking contract setup.");
                    _j.label = 6;
                case 6:
                    _j.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, account.viewFunction(newAccountId, "get_address")];
                case 7:
                    ethRes = _j.sent();
                    // any reason the address wasn't set properly
                    if (!ethRes || !ethRes.length) {
                        return [2 /*return*/, (0, exports.handleSetupContract)()];
                    }
                    return [3 /*break*/, 9];
                case 8:
                    e_9 = _j.sent();
                    // not set at all (wasm error unreachable storage value)
                    logger.log(e_9);
                    return [2 /*return*/, (0, exports.handleSetupContract)()];
                case 9:
                    logger.log("Checking access keys.");
                    return [4 /*yield*/, account.getAccessKeys()];
                case 10:
                    accessKeys = _j.sent();
                    if (accessKeys.length === 1 &&
                        ((_h = (_g = accessKeys[0]) === null || _g === void 0 ? void 0 : _g.access_key) === null || _h === void 0 ? void 0 : _h.permission) === "FullAccess") {
                        return [2 /*return*/, (0, exports.handleKeys)()];
                    }
                    logger.log("Account created.");
                    logger.log("Contract deployed and setup.");
                    logger.log("Mapping added.");
                    logger.log("Keys rotated.");
                    return [4 /*yield*/, storage.removeItem(ATTEMPT_ACCOUNT_ID)];
                case 11:
                    _j.sent();
                    return [4 /*yield*/, storage.removeItem(ATTEMPT_SECRET_KEY)];
                case 12:
                    _j.sent();
                    return [4 /*yield*/, storage.removeItem(ATTEMPT_ETH_ADDRESS)];
                case 13:
                    _j.sent();
                    return [2 /*return*/, { account: account }];
            }
        });
    });
};
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
                    return [2 /*return*/, logger.log("App key rotation unsuccessful. ".concat(REFRESH_MSG))];
                }
                return [4 /*yield*/, storage.removeItem(APP_KEY_SECRET)];
            case 10:
                _f.sent();
                return [4 /*yield*/, storage.removeItem(APP_KEY_ACCOUNT_ID)];
            case 11:
                _f.sent();
                return [2 /*return*/, { publicKey: public_key, secretKey: secretKey }];
        }
    });
}); };
exports.handleRefreshAppKey = handleRefreshAppKey;
var handleUpdateContract = function (signer, ethAddress) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, account, accountId, contractPath, ab, contractBytes, actions, nonce, _b, args, res;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0: return [4 /*yield*/, getUnlimitedKeyAccount(signer, ethAddress)];
            case 1:
                _a = _d.sent(), account = _a.account, accountId = _a.accountId;
                contractPath = window === null || window === void 0 ? void 0 : window.contractPath;
                return [4 /*yield*/, fetch(contractPath).then(function (res) {
                        return res.arrayBuffer();
                    })];
            case 2:
                ab = _d.sent();
                contractBytes = new Uint8Array(ab);
                actions = [
                    {
                        type: "DeployContract",
                        code: buf2hex(contractBytes),
                    },
                ];
                _b = parseInt;
                return [4 /*yield*/, account.viewFunction(accountId, "get_nonce")];
            case 3:
                nonce = _b.apply(void 0, [_d.sent(), 16]).toString();
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
                args = _d.sent();
                return [4 /*yield*/, account.functionCall({
                        contractId: accountId,
                        methodName: "execute",
                        args: args,
                        gas: gas,
                    })];
            case 5:
                res = _d.sent();
                if (((_c = res === null || res === void 0 ? void 0 : res.status) === null || _c === void 0 ? void 0 : _c.SuccessValue) !== "") {
                    return [2 /*return*/, logger.log("Redeply contract unsuccessful. ".concat(REFRESH_MSG))];
                }
                return [2 /*return*/];
        }
    });
}); };
exports.handleUpdateContract = handleUpdateContract;
/// account disconnecting flow
var handleDisconnect = function (signer, ethAddress) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, account, accountId, secretKey, _b, seedPhrase, publicKey, newSecretKey, _seedPhrase, oldUnlimitedKey, actions, accessKeys, appKeyNonce, _c, oldPublicKey, oldPublicKeyHex, nonce, _d, args, res, mapRes, e_10;
    var _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0: return [4 /*yield*/, getUnlimitedKeyAccount(signer, ethAddress)];
            case 1:
                _a = _g.sent(), account = _a.account, accountId = _a.accountId, secretKey = _a.secretKey;
                _b = (0, near_seed_phrase_1.generateSeedPhrase)(), seedPhrase = _b.seedPhrase, publicKey = _b.publicKey, newSecretKey = _b.secretKey;
                _seedPhrase = window.prompt("Copy this down and keep it safe!!! This is your new seed phrase!!!", seedPhrase);
                if (seedPhrase !== _seedPhrase) {
                    return [2 /*return*/, alert("There was an error copying seed phrase. Nothing has been done. Please try again.")];
                }
                oldUnlimitedKey = KeyPair.fromString(secretKey);
                actions = [
                    {
                        type: "DeleteKey",
                        public_key: pub2hex(oldUnlimitedKey.getPublicKey().toString()),
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
                        gas: halfGas,
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
                    return [2 /*return*/, logger.log("app key rotation unsuccessful")];
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
                mapRes = _g.sent();
                logger.log(mapRes);
                if (((_f = mapRes === null || mapRes === void 0 ? void 0 : mapRes.status) === null || _f === void 0 ? void 0 : _f.SuccessValue) !== "") {
                    logger.log("account mapping removal failed");
                }
                return [3 /*break*/, 12];
            case 11:
                e_10 = _g.sent();
                logger.log(e_10);
                return [3 /*break*/, 12];
            case 12: return [2 /*return*/, { account: account }];
        }
    });
}); };
exports.handleDisconnect = handleDisconnect;
/// helpers for account creation and connection domain
var setupFromStorage = function (accountId) {
    if (accountId === void 0) { accountId = ""; }
    return __awaiter(void 0, void 0, void 0, function () {
        var newAccountId, _a, newSecretKey, ethAddress, account, keyPair;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(accountId.length > 0)) return [3 /*break*/, 1];
                    _a = accountId;
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, storage.getItem(ATTEMPT_ACCOUNT_ID)];
                case 2:
                    _a = _b.sent();
                    _b.label = 3;
                case 3:
                    newAccountId = _a;
                    return [4 /*yield*/, storage.getItem(ATTEMPT_SECRET_KEY)];
                case 4:
                    newSecretKey = _b.sent();
                    return [4 /*yield*/, storage.getItem(ATTEMPT_ETH_ADDRESS)];
                case 5:
                    ethAddress = _b.sent();
                    account = new Account(connection, newAccountId);
                    if (newSecretKey) {
                        keyPair = KeyPair.fromString(newSecretKey);
                        keyStore.setKey(networkId, newAccountId, keyPair);
                    }
                    return [2 /*return*/, { newAccountId: newAccountId, newSecretKey: newSecretKey, ethAddress: ethAddress, account: account, keyPair: keyPair }];
            }
        });
    });
};
var getUnlimitedKeyAccount = function (signer, ethAddress, tryPrevUrl) {
    if (tryPrevUrl === void 0) { tryPrevUrl = false; }
    return __awaiter(void 0, void 0, void 0, function () {
        var accountId, secretKey, _secretKey, account, keyPair, publicKey, accessKeys;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage.getItem(ATTEMPT_SECRET_KEY)];
                case 1:
                    secretKey = _a.sent();
                    if (!!secretKey) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, exports.getNearMap)(ethAddress)];
                case 2:
                    // TODO remove dep on near-utils
                    // use any random near account to check mapping
                    accountId = _a.sent();
                    return [4 /*yield*/, keyPairFromEthSig(signer, unlimitedKeyPayload(accountId, tryPrevUrl))];
                case 3:
                    _secretKey = (_a.sent()).secretKey;
                    secretKey = _secretKey;
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, storage.getItem(ATTEMPT_ACCOUNT_ID)];
                case 5:
                    accountId = _a.sent();
                    _a.label = 6;
                case 6:
                    account = new Account(connection, accountId);
                    keyPair = KeyPair.fromString(secretKey);
                    publicKey = keyPair.getPublicKey().toString();
                    return [4 /*yield*/, account.getAccessKeys()];
                case 7:
                    accessKeys = _a.sent();
                    if (!!accessKeys.some(function (_a) {
                        var public_key = _a.public_key;
                        return publicKey === public_key;
                    })) return [3 /*break*/, 9];
                    return [4 /*yield*/, getUnlimitedKeyAccount(signer, ethAddress, true)];
                case 8: return [2 /*return*/, _a.sent()];
                case 9:
                    keyStore.setKey(networkId, accountId, keyPair);
                    return [2 /*return*/, { account: account, accountId: accountId, secretKey: secretKey }];
            }
        });
    });
};
/**
 * The access key payloads, unlimited and limited
 */
var appKeyPayload = function (accountId, appKeyNonce) { return ({
    WARNING: "Creating key for: ".concat(accountId),
    nonce: appKeyNonce,
    description: "ONLY sign this on apps you trust! This key CAN use up to 1 N for transactions.",
}); };
var unlimitedKeyPayload = function (accountId, tryPrevUrl) { return ({
    WARNING: "Creates a key with access to your (new) paired NEAR Account: ".concat(accountId),
    description: "ONLY sign this message on this website: ".concat(tryPrevUrl ? exports.PREV_NETH_SITE_URL : exports.NETH_SITE_URL),
}); };
var fundingKeyPayload = function () { return ({
    WARNING: "This creates a full access key in your localStorage to a funding account you will be sending NEAR to.",
    description: "ONLY sign this message on this website: ".concat(exports.NETH_SITE_URL),
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
    var Transaction, types, numReceivers, sig, args;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                Transaction = [];
                types = { Transaction: Transaction };
                Object.entries(json).forEach(function (_a) {
                    var k = _a[0];
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
                            if (!action.args) {
                                return;
                            }
                            if (Buffer.isBuffer(action.args)) {
                                action.args = "0x" + action.args.toString("hex");
                                return;
                            }
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
                        json.receivers.substring(0, 4) +
                            numReceivers.padStart(3, "0") +
                            json.receivers.substring(7);
                }
                return [4 /*yield*/, signer._signTypedData(domain, types, json)];
            case 1:
                sig = _a.sent();
                args = {
                    sig: sig,
                    msg: json,
                };
                // logger.log('\nargs\n', JSON.stringify(args, null, 4), '\n');
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
    var provider, e_11, code, e2_1, ethersProvider, accounts, signer;
    var _a;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0: return [4 /*yield*/, (0, detect_provider_1.default)()];
            case 1:
                provider = _d.sent();
                if (!provider) {
                    return [2 /*return*/, alert("Please install/activate MetaMask and try again.")];
                }
                _d.label = 2;
            case 2:
                _d.trys.push([2, 4, , 9]);
                return [4 /*yield*/, window.ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: "0x" + domain.chainId.toString(16) }],
                    })];
            case 3:
                _d.sent();
                return [3 /*break*/, 9];
            case 4:
                e_11 = _d.sent();
                code = (e_11 === null || e_11 === void 0 ? void 0 : e_11.code) || ((_c = (_b = e_11 === null || e_11 === void 0 ? void 0 : e_11.data) === null || _b === void 0 ? void 0 : _b.originalError) === null || _c === void 0 ? void 0 : _c.code);
                if (code !== 4902) {
                    throw e_11;
                }
                _d.label = 5;
            case 5:
                _d.trys.push([5, 7, , 8]);
                return [4 /*yield*/, window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [
                            {
                                chainId: "0x" + domain.chainId.toString(16),
                                chainName: "Aurora Mainnet",
                                nativeCurrency: {
                                    name: "Ethereum",
                                    symbol: "ETH",
                                    decimals: 18,
                                },
                                blockExplorerUrls: ["https://explorer.mainnet.aurora.dev/"],
                                rpcUrls: ["https://mainnet.aurora.dev"],
                            },
                        ],
                    })];
            case 6:
                _d.sent();
                return [3 /*break*/, 8];
            case 7:
                e2_1 = _d.sent();
                alert('Please click "Choose Ethereum Account" and in your MetaMask add the Aurora Network to continue.');
                throw e2_1;
            case 8: return [3 /*break*/, 9];
            case 9:
                ethersProvider = new ethers_1.ethers.providers.Web3Provider(window.ethereum);
                return [4 /*yield*/, ethersProvider.listAccounts()];
            case 10:
                accounts = _d.sent();
                if (!(accounts.length === 0)) return [3 /*break*/, 12];
                return [4 /*yield*/, ethersProvider.send("eth_requestAccounts", [])];
            case 11:
                _d.sent();
                _d.label = 12;
            case 12:
                signer = ethersProvider.getSigner();
                _a = { signer: signer };
                return [4 /*yield*/, signer.getAddress()];
            case 13: return [2 /*return*/, (_a.ethAddress = _d.sent(), _a)];
        }
    });
}); };
exports.getEthereum = getEthereum;
var switchEthereum = function () { return __awaiter(void 0, void 0, void 0, function () {
    var provider, ethersProvider, signer;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, detect_provider_1.default)()];
            case 1:
                provider = (_b.sent());
                return [4 /*yield*/, provider.send("wallet_requestPermissions", [{ eth_accounts: {} }])];
            case 2:
                _b.sent();
                ethersProvider = new ethers_1.ethers.providers.Web3Provider(window.ethereum);
                signer = ethersProvider.getSigner();
                _a = { signer: signer };
                return [4 /*yield*/, signer.getAddress()];
            case 3: return [2 /*return*/, (_a.ethAddress = _b.sent(), _a)];
        }
    });
}); };
exports.switchEthereum = switchEthereum;
/// near
var getNearMap = function (eth_address) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, contractAccount.viewFunction(NETWORK[networkId].MAP_ACCOUNT_ID, "get_near", { eth_address: eth_address })];
    });
}); };
exports.getNearMap = getNearMap;
var getNear = function () { return __awaiter(void 0, void 0, void 0, function () {
    var secretKey, accountId, ethRes, res, account, keyPair;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, storage.getItem(APP_KEY_SECRET)];
            case 1:
                secretKey = _a.sent();
                return [4 /*yield*/, storage.getItem(APP_KEY_ACCOUNT_ID)];
            case 2:
                accountId = _a.sent();
                if (!(!secretKey || !accountId)) return [3 /*break*/, 6];
                return [4 /*yield*/, (0, exports.getEthereum)()];
            case 3:
                ethRes = _a.sent();
                return [4 /*yield*/, (0, exports.getAppKey)(ethRes)];
            case 4:
                res = _a.sent();
                if (!res) {
                    return [2 /*return*/, false];
                }
                return [4 /*yield*/, (0, exports.getNear)()];
            case 5: return [2 /*return*/, _a.sent()];
            case 6:
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
        switch (_a.label) {
            case 0: return [4 /*yield*/, storage.getItem(APP_KEY_ACCOUNT_ID)];
            case 1:
                accountId = _a.sent();
                if (!accountId) {
                    return [2 /*return*/, logger.log("already signed out")];
                }
                return [4 /*yield*/, storage.removeItem(APP_KEY_SECRET)];
            case 2:
                _a.sent();
                return [4 /*yield*/, storage.removeItem(APP_KEY_ACCOUNT_ID)];
            case 3:
                _a.sent();
                return [2 /*return*/, { accountId: accountId }];
        }
    });
}); };
exports.signOut = signOut;
var verifyOwner = function (_a) {
    var message = _a.message, provider = _a.provider, account = _a.account;
    return __awaiter(void 0, void 0, void 0, function () {
        var accountId, pubKey, publicKey, block, blockId, data, encoded, signed;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!!account) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, exports.getNear)()];
                case 1:
                    (_b = _c.sent(), account = _b.account, accountId = _b.accountId);
                    return [3 /*break*/, 3];
                case 2:
                    (accountId = account.accountId);
                    _c.label = 3;
                case 3:
                    if (!account) {
                        throw new Error("Wallet not signed in");
                    }
                    return [4 /*yield*/, account.connection.signer.getPublicKey(accountId, networkId)];
                case 4:
                    pubKey = _c.sent();
                    publicKey = Buffer.from(pubKey.data).toString("base64");
                    return [4 /*yield*/, provider.block({ finality: "final" })];
                case 5:
                    block = _c.sent();
                    blockId = block.header.hash;
                    data = {
                        accountId: accountId,
                        message: message,
                        blockId: blockId,
                        publicKey: publicKey,
                        keyType: pubKey.keyType,
                    };
                    encoded = JSON.stringify(data);
                    return [4 /*yield*/, account.connection.signer.signMessage(new Uint8Array(Buffer.from(encoded)), accountId, networkId)];
                case 6:
                    signed = _c.sent();
                    return [2 /*return*/, __assign(__assign({}, data), { signature: Buffer.from(signed.signature).toString("base64") })];
            }
        });
    });
};
exports.verifyOwner = verifyOwner;
var isSignedIn = function () { return __awaiter(void 0, void 0, void 0, function () {
    var tempStorage, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                tempStorage = defaultStorage(WS_STORAGE_NAMESPACE);
                return [4 /*yield*/, tempStorage.getItem(APP_KEY_SECRET)];
            case 1:
                _a = !!(_b.sent());
                if (_a) return [3 /*break*/, 3];
                return [4 /*yield*/, tempStorage.getItem(APP_KEY_ACCOUNT_ID)];
            case 2:
                _a = !!(_b.sent());
                _b.label = 3;
            case 3: return [2 /*return*/, (_a)];
        }
    });
}); };
exports.isSignedIn = isSignedIn;
// const promptValidAccountId = async (msg) => {
//   const newAccountId = window.prompt(msg);
//   if (!newAccountId) {
//     throw new Error("NETH Error: failed to pick valid NEAR account name");
//   }
//   if (
//     newAccountId.length < 2 ||
//     newAccountId.indexOf(".") > -1 ||
//     !ACCOUNT_REGEX.test(newAccountId) ||
//     newAccountId.length > 64
//   ) {
//     return promptValidAccountId(
//       `account is invalid (a-z, 0-9 and -,_ only; min 2; max 64; ${accountSuffix} applied automatically)`
//     );
//   }
//   if (await accountExists(newAccountId)) {
//     return promptValidAccountId(`account already exists`);
//   }
//   return newAccountId;
// };
var getAppKey = function (_a) {
    var signer = _a.signer, eth_address = _a.ethAddress;
    return __awaiter(void 0, void 0, void 0, function () {
        var accountId, tryAgain, _b, _signer, ethAddress, e_12, nethURL, appKeyNonce, _c, _d, publicKey, secretKey, account, accessKeys, keyPair;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, (0, exports.getNearMap)(eth_address)];
                case 1:
                    accountId = _e.sent();
                    if (!!accountId) return [3 /*break*/, 8];
                    tryAgain = window.confirm("Ethereum account ".concat(eth_address, " is not connected to a NETH account. Would you like to try another Ethereum account?"));
                    if (!tryAgain) return [3 /*break*/, 7];
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, (0, exports.switchEthereum)()];
                case 3:
                    _b = _e.sent(), _signer = _b.signer, ethAddress = _b.ethAddress;
                    return [4 /*yield*/, (0, exports.getAppKey)({ signer: _signer, ethAddress: ethAddress })];
                case 4: return [2 /*return*/, _e.sent()];
                case 5:
                    e_12 = _e.sent();
                    logger.log(e_12);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
                case 7:
                    nethURL = "".concat(exports.NETH_SITE_URL, "/").concat(networkId === "testnet" ? "?network=testnet" : "");
                    window.prompt("We couldn't find a NETH account. To set up a NETH account visit", nethURL);
                    _e.label = 8;
                case 8:
                    _c = parseInt;
                    return [4 /*yield*/, contractAccount.viewFunction(accountId, "get_app_key_nonce")];
                case 9:
                    appKeyNonce = _c.apply(void 0, [_e.sent(), 16]).toString();
                    return [4 /*yield*/, keyPairFromEthSig(signer, appKeyPayload(accountId, appKeyNonce))];
                case 10:
                    _d = _e.sent(), publicKey = _d.publicKey, secretKey = _d.secretKey;
                    account = new Account(connection, accountId);
                    return [4 /*yield*/, account.getAccessKeys()];
                case 11:
                    accessKeys = _e.sent();
                    if (!!(0, exports.hasAppKey)(accessKeys)) return [3 /*break*/, 13];
                    return [4 /*yield*/, (0, exports.handleRefreshAppKey)(signer, eth_address)];
                case 12:
                    _e.sent();
                    _e.label = 13;
                case 13:
                    keyPair = KeyPair.fromString(secretKey);
                    keyStore.setKey(networkId, accountId, keyPair);
                    return [4 /*yield*/, storage.setItem(APP_KEY_SECRET, secretKey)];
                case 14:
                    _e.sent();
                    return [4 /*yield*/, storage.setItem(APP_KEY_ACCOUNT_ID, account.accountId)];
                case 15:
                    _e.sent();
                    return [2 /*return*/, { publicKey: publicKey, secretKey: secretKey, account: account }];
            }
        });
    });
};
exports.getAppKey = getAppKey;
var broadcastTXs = function () { return __awaiter(void 0, void 0, void 0, function () {
    var args, _a, account, accountId, res, currentArgs, tx, e_13;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, storage.getItem(TX_ARGS_ATTEMPT)];
            case 1:
                args = _b.sent();
                if (!args || args.length === 0) {
                    return [2 /*return*/];
                }
                return [4 /*yield*/, (0, exports.getNear)()];
            case 2:
                _a = _b.sent(), account = _a.account, accountId = _a.accountId;
                res = [];
                _b.label = 3;
            case 3:
                if (!(args.length > 0)) return [3 /*break*/, 9];
                currentArgs = args.shift();
                logger.log("NETH: broadcasting tx", currentArgs);
                _b.label = 4;
            case 4:
                _b.trys.push([4, 7, , 8]);
                return [4 /*yield*/, account.functionCall({
                        contractId: accountId,
                        methodName: "execute",
                        args: currentArgs,
                        gas: gas,
                    })];
            case 5:
                tx = _b.sent();
                return [4 /*yield*/, storage.setItem(TX_ARGS_ATTEMPT, args)];
            case 6:
                _b.sent();
                res.push(tx);
                return [3 /*break*/, 8];
            case 7:
                e_13 = _b.sent();
                logger.log("NETH: ERROR broadcasting tx", e_13);
                return [3 /*break*/, 8];
            case 8: return [3 /*break*/, 3];
            case 9: return [4 /*yield*/, storage.removeItem(TX_ARGS_ATTEMPT)];
            case 10:
                _b.sent();
                return [2 /*return*/, res];
        }
    });
}); };
var signAndSendTransactions = function (_a) {
    var transactions = _a.transactions, bundle = _a.bundle;
    return __awaiter(void 0, void 0, void 0, function () {
        var ethRes, signer, _b, account, accountId, receivers, transformedTxs, nonce, _c, args, i, _d, _e, _f, _g, res;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0: return [4 /*yield*/, (0, exports.getEthereum)()];
                case 1:
                    ethRes = _h.sent();
                    signer = ethRes.signer;
                    return [4 /*yield*/, (0, exports.getNear)()];
                case 2:
                    _b = _h.sent(), account = _b.account, accountId = _b.accountId;
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
                    nonce = _c.apply(void 0, [_h.sent(), 16]);
                    args = [];
                    if (!!bundle) return [3 /*break*/, 8];
                    i = 0;
                    _h.label = 4;
                case 4:
                    if (!(i < transformedTxs.length)) return [3 /*break*/, 7];
                    _e = (_d = args).push;
                    return [4 /*yield*/, ethSignJson(signer, {
                            nonce: (nonce + i).toString(),
                            receivers: [receivers[i]],
                            transactions: [transformedTxs[i]],
                        })];
                case 5:
                    _e.apply(_d, [_h.sent()]);
                    _h.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 4];
                case 7: return [3 /*break*/, 10];
                case 8:
                    _g = (_f = args).push;
                    return [4 /*yield*/, ethSignJson(signer, {
                            nonce: nonce.toString(),
                            receivers: receivers,
                            transactions: transformedTxs,
                        })];
                case 9:
                    _g.apply(_f, [_h.sent()]);
                    _h.label = 10;
                case 10: return [4 /*yield*/, storage.setItem(TX_ARGS_ATTEMPT, args)];
                case 11:
                    _h.sent();
                    return [4 /*yield*/, broadcastTXs()];
                case 12:
                    res = _h.sent();
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
        var _a = _action[type] || _action, _gas = _a.gas, publicKey = _a.publicKey, methodName = _a.methodName, args = _a.args, deposit = _a.deposit, accessKey = _a.accessKey, code = _a.code;
        var action = {
            type: (type && type[0].toUpperCase() + type.substr(1)) || "FunctionCall",
            gas: (_gas && _gas.toString()) || undefined,
            public_key: (publicKey && pub2hex(publicKey)) || undefined,
            method_name: methodName,
            args: args || undefined,
            code: code || undefined,
            amount: (deposit && deposit.toString()) || undefined,
            permission: undefined,
        };
        Object.keys(action).forEach(function (k) {
            if (action[k] === undefined) {
                delete action[k];
            }
        });
        if (accessKey) {
            if (receiverId === accountId) {
                action.allowance = parseNearAmount("1");
                action.method_names = "execute";
                action.receiver_id = accountId;
            }
            else if (accessKey.permission.enum === "functionCall") {
                var _b = accessKey.permission.functionCall, _receiverId = _b.receiverId, methodNames = _b.methodNames, allowance = _b.allowance;
                action.receiver_id = _receiverId;
                action.allowance =
                    (allowance && allowance.toString()) || parseNearAmount("0.25");
                action.method_names = methodNames.join(",");
            }
        }
        return action;
    });
};
exports.convertActions = convertActions;
