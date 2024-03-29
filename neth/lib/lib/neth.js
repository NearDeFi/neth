"use strict";
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
exports.setupNeth = exports.initConnection = void 0;
var detect_provider_1 = __importDefault(require("@metamask/detect-provider"));
var icons_1 = require("../assets/icons");
var neth_lib_1 = require("./neth-lib");
var is_mobile_1 = __importDefault(require("is-mobile"));
var neth_lib_2 = require("./neth-lib");
Object.defineProperty(exports, "initConnection", { enumerable: true, get: function () { return neth_lib_2.initConnection; } });
var isInstalled = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, detect_provider_1.default)({ timeout: 100 })];
            case 1:
                _a.sent();
                return [2 /*return*/, !!window.ethereum];
        }
    });
}); };
var bundle = true;
var useCover = false;
var customGas;
var Neth = function (_a) {
    var metadata = _a.metadata, logger = _a.logger, store = _a.store, storage = _a.storage, options = _a.options, provider = _a.provider;
    return __awaiter(void 0, void 0, void 0, function () {
        var cover, isValidActions, transformActions, signTransactions;
        return __generator(this, function (_b) {
            cover = (0, neth_lib_1.initConnection)({
                network: options.network,
                gas: customGas,
                logger: logger,
                storage: storage,
            });
            isValidActions = function (actions) {
                return actions.every(function (x) { return neth_lib_1.VALID_ACTIONS.includes(x.type); });
            };
            transformActions = function (actions) {
                var validActions = isValidActions(actions);
                if (!validActions) {
                    throw new Error("Only 'FunctionCall' actions types are supported by ".concat(metadata.name));
                }
                return actions.map(function (x) { return x.params; });
            };
            signTransactions = function (transactions) { return __awaiter(void 0, void 0, void 0, function () {
                var contract, transformedTxs, res, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            logger.log("NETH:signAndSendTransactions", { transactions: transactions });
                            contract = store.getState().contract;
                            return [4 /*yield*/, (0, neth_lib_1.isSignedIn)()];
                        case 1:
                            if (!(_a.sent()) || !contract) {
                                throw new Error("Wallet not signed in");
                            }
                            if (useCover) {
                                cover.style.display = "block";
                            }
                            transformedTxs = transactions.map(function (_a) {
                                var receiverId = _a.receiverId, actions = _a.actions;
                                return ({
                                    receiverId: receiverId || contract.contractId,
                                    actions: transformActions(actions),
                                });
                            });
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, (0, neth_lib_1.signAndSendTransactions)({
                                    transactions: transformedTxs,
                                    bundle: bundle,
                                })];
                        case 3:
                            res = _a.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            e_1 = _a.sent();
                            /// "user rejected signing" or near network error
                            logger.log("NETH:signAndSendTransactions Error", e_1);
                            throw e_1;
                        case 5:
                            if (useCover) {
                                cover.style.display = "none";
                            }
                            return [2 /*return*/, res];
                    }
                });
            }); };
            // return the wallet interface for wallet-selector
            return [2 /*return*/, {
                    signIn: function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var account, e_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, (0, neth_lib_1.signIn)()];
                                    case 1:
                                        account = _a.sent();
                                        if (!account) {
                                            return [2 /*return*/, []];
                                        }
                                        return [3 /*break*/, 3];
                                    case 2:
                                        e_2 = _a.sent();
                                        if (!/not connected/.test(e_2.toString())) {
                                            throw e_2;
                                        }
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/, [account]];
                                }
                            });
                        });
                    },
                    signOut: function () {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, neth_lib_1.signOut)()];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    },
                    verifyOwner: function (_a) {
                        var message = _a.message;
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_b) {
                                logger.log("NETH:verifyOwner", { message: message });
                                return [2 /*return*/, (0, neth_lib_1.verifyOwner)({ message: message, provider: provider, account: null })];
                            });
                        });
                    },
                    getAccounts: function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var _a, accountId, account;
                            var _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0: return [4 /*yield*/, (0, neth_lib_1.getNear)()];
                                    case 1:
                                        _a = _c.sent(), accountId = _a.accountId, account = _a.account;
                                        _b = {
                                            accountId: accountId
                                        };
                                        return [4 /*yield*/, account.connection.signer.getPublicKey(account.accountId, options.network.networkId)];
                                    case 2: return [2 /*return*/, [
                                            (_b.publicKey = (_c.sent()).toString(),
                                                _b)
                                        ]];
                                }
                            });
                        });
                    },
                    signAndSendTransaction: function (_a) {
                        var receiverId = _a.receiverId, actions = _a.actions;
                        return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_b) {
                            return [2 /*return*/, signTransactions([{ receiverId: receiverId, actions: actions }])];
                        }); });
                    },
                    signAndSendTransactions: function (_a) {
                        var transactions = _a.transactions;
                        return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_b) {
                            return [2 /*return*/, signTransactions(transactions)];
                        }); });
                    },
                }];
        });
    });
};
function setupNeth(_a) {
    var _this = this;
    var _b = _a === void 0 ? {} : _a, _c = _b.iconUrl, iconUrl = _c === void 0 ? icons_1.nethIcon : _c, gas = _b.gas, _d = _b.useModalCover, useModalCover = _d === void 0 ? false : _d, _e = _b.bundle, _bundle = _e === void 0 ? true : _e, _f = _b.deprecated, deprecated = _f === void 0 ? false : _f;
    return function () { return __awaiter(_this, void 0, void 0, function () {
        var mobile, installed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    useCover = useModalCover;
                    customGas = gas;
                    bundle = _bundle;
                    mobile = (0, is_mobile_1.default)();
                    if (mobile) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, isInstalled()];
                case 1:
                    installed = _a.sent();
                    return [2 /*return*/, {
                            id: "neth",
                            type: "injected",
                            metadata: {
                                name: "NETH Account",
                                description: null,
                                iconUrl: iconUrl,
                                downloadUrl: neth_lib_1.NETH_SITE_URL,
                                deprecated: false,
                                available: installed,
                            },
                            deprecated: deprecated,
                            init: Neth,
                        }];
            }
        });
    }); };
}
exports.setupNeth = setupNeth;
