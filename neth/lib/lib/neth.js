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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupNeth = exports.initConnection = void 0;
var core_1 = require("@near-wallet-selector/core");
var icons_1 = require("../assets/icons");
var neth_lib_1 = require("./neth-lib");
var neth_lib_2 = require("./neth-lib");
Object.defineProperty(exports, "initConnection", { enumerable: true, get: function () { return neth_lib_2.initConnection; } });
var isInstalled = function () {
    return !!window.ethereum;
};
var isMobile = function () {
    var check = false;
    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a))
            check = true;
    })(navigator.userAgent || navigator.vendor);
    return check;
};
var useCover = false;
var Neth = function (_a) {
    var metadata = _a.metadata, logger = _a.logger, options = _a.options;
    return __awaiter(void 0, void 0, void 0, function () {
        var cover, coverImg, isValidActions, transformActions;
        return __generator(this, function (_b) {
            (0, neth_lib_1.initConnection)(options.network);
            cover = document.createElement("div");
            coverImg = document.createElement("img");
            coverImg.src = icons_1.nearWalletIcon;
            cover.className = "modal-overlay-standalone";
            cover.style.display = "none";
            cover.appendChild(coverImg);
            document.body.appendChild(cover);
            isValidActions = function (actions) {
                return actions.every(function (x) { return x.type === "FunctionCall"; });
            };
            transformActions = function (actions) {
                var validActions = isValidActions(actions);
                if (!validActions) {
                    throw new Error("Only 'FunctionCall' actions types are supported by ".concat(metadata.name));
                }
                return actions.map(function (x) { return x.params; });
            };
            // return the wallet interface for wallet-selector
            return [2 /*return*/, {
                    signIn: function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var account, e_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, (0, neth_lib_1.signIn)()];
                                    case 1:
                                        account = _a.sent();
                                        return [3 /*break*/, 3];
                                    case 2:
                                        e_1 = _a.sent();
                                        if (!/not connected/.test(e_1.toString()))
                                            throw e_1;
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
                                // logger.log("Sender:verifyOwner", { message });
                                // const account = _state.wallet.account();
                                // if (!account) {
                                //   throw new Error("Wallet not signed in");
                                // }
                                // // Note: When the wallet is locked, Sender returns an empty Signer interface.
                                // // Even after unlocking the wallet, the user will need to refresh to gain
                                // // access to these methods.
                                // if (!account.connection.signer.signMessage) {
                                //   throw new Error("Wallet is locked");
                                // }
                                // const networkId = options.network.networkId;
                                // const accountId = account.accountId;
                                // const pubKey = await account.connection.signer.getPublicKey(
                                //   accountId,
                                //   networkId
                                // );
                                // const block = await provider.block({ finality: "final" });
                                // const data = {
                                //   accountId,
                                //   message,
                                //   blockId: block.header.hash,
                                //   publicKey: Buffer.from(pubKey.data).toString("base64"),
                                //   keyType: pubKey.keyType,
                                // };
                                // const encoded = JSON.stringify(data);
                                // const signed = await account.connection.signer.signMessage(
                                //   new Uint8Array(Buffer.from(encoded)),
                                //   accountId,
                                //   networkId
                                // );
                                return [2 /*return*/, {
                                        accountId: '',
                                        message: '',
                                        blockId: '',
                                        publicKey: '',
                                        keyType: 0,
                                        signature: '',
                                    }];
                            });
                        });
                    },
                    getAccounts: function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var accountId;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, neth_lib_1.getNear)()];
                                    case 1:
                                        accountId = (_a.sent()).accountId;
                                        return [2 /*return*/, [{ accountId: accountId }]];
                                }
                            });
                        });
                    },
                    signAndSendTransaction: function (_a) {
                        var receiverId = _a.receiverId, actions = _a.actions;
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_b) {
                                logger.log("Neth:signAndSendTransaction", {
                                    receiverId: receiverId,
                                    actions: actions,
                                });
                                return [2 /*return*/, (0, neth_lib_1.signAndSendTransactions)({
                                        transactions: [
                                            {
                                                receiverId: receiverId,
                                                actions: transformActions(actions),
                                            },
                                        ],
                                    })];
                            });
                        });
                    },
                    signAndSendTransactions: function (_a) {
                        var transactions = _a.transactions;
                        return __awaiter(this, void 0, void 0, function () {
                            var transformedTxs, res, e_2;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        logger.log("Neth:signAndSendTransactions", { transactions: transactions });
                                        if (useCover) {
                                            cover.style.display = "block";
                                        }
                                        transformedTxs = transactions.map(function (_a) {
                                            var receiverId = _a.receiverId, actions = _a.actions;
                                            return ({
                                                receiverId: receiverId,
                                                actions: transformActions(actions),
                                            });
                                        });
                                        _b.label = 1;
                                    case 1:
                                        _b.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, (0, neth_lib_1.signAndSendTransactions)({
                                                transactions: transformedTxs,
                                            })];
                                    case 2:
                                        res = _b.sent();
                                        return [3 /*break*/, 4];
                                    case 3:
                                        e_2 = _b.sent();
                                        /// user cancelled or near network error
                                        console.warn(e_2);
                                        return [3 /*break*/, 4];
                                    case 4:
                                        if (useCover) {
                                            cover.style.display = "none";
                                        }
                                        return [2 /*return*/, res];
                                }
                            });
                        });
                    },
                }];
        });
    });
};
function setupNeth(_a) {
    var _this = this;
    var _b = _a === void 0 ? {} : _a, _c = _b.useModalCover, useModalCover = _c === void 0 ? false : _c, _d = _b.iconUrl, iconUrl = _d === void 0 ? icons_1.nearWalletIcon : _d;
    return function () { return __awaiter(_this, void 0, void 0, function () {
        var mobile, installed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mobile = isMobile();
                    return [4 /*yield*/, isInstalled()];
                case 1:
                    installed = _a.sent();
                    useCover = useModalCover;
                    if (mobile || !installed) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, (0, core_1.waitFor)(function () { var _a; return !!((_a = window.near) === null || _a === void 0 ? void 0 : _a.isSignedIn()); }, { timeout: 300 }).catch(function () { return false; })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, {
                            id: "neth",
                            type: "injected",
                            metadata: {
                                name: "NETH Account",
                                description: null,
                                iconUrl: iconUrl,
                                downloadUrl: "https://example.com",
                                deprecated: false,
                                available: true,
                            },
                            init: Neth,
                        }];
            }
        });
    }); };
}
exports.setupNeth = setupNeth;