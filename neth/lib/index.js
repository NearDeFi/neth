"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
<<<<<<< HEAD
exports.initConnection = exports.signAndSendTransactions = exports.isSignedIn = exports.signOut = exports.signIn = exports.hasAppKey = exports.handleRefreshAppKey = exports.handleUpdateContract = exports.handleDisconnect = exports.getNearMap = exports.handleCheckAccount = exports.switchEthereum = exports.handleCreate = exports.getEthereum = exports.getConnection = exports.accountExists = exports.getNear = exports.setupNeth = void 0;
=======
exports.initConnection = exports.signAndSendTransactions = exports.isSignedIn = exports.signOut = exports.signIn = exports.hasAppKey = exports.handleRefreshAppKey = exports.handleUpdateContract = exports.handleDisconnect = exports.getNearMap = exports.handleCheckAccount = exports.switchEthereum = exports.accountExists = exports.handleCreate = exports.getEthereum = exports.getConnection = exports.getNear = exports.setupNeth = void 0;
>>>>>>> 635e01f5799ea7739418a0e5c55ed6fd03372cd4
var neth_1 = require("./lib/neth");
Object.defineProperty(exports, "setupNeth", { enumerable: true, get: function () { return neth_1.setupNeth; } });
var neth_lib_1 = require("./lib/neth-lib");
Object.defineProperty(exports, "getNear", { enumerable: true, get: function () { return neth_lib_1.getNear; } });
Object.defineProperty(exports, "accountExists", { enumerable: true, get: function () { return neth_lib_1.accountExists; } });
Object.defineProperty(exports, "getConnection", { enumerable: true, get: function () { return neth_lib_1.getConnection; } });
Object.defineProperty(exports, "getEthereum", { enumerable: true, get: function () { return neth_lib_1.getEthereum; } });
Object.defineProperty(exports, "handleCreate", { enumerable: true, get: function () { return neth_lib_1.handleCreate; } });
Object.defineProperty(exports, "accountExists", { enumerable: true, get: function () { return neth_lib_1.accountExists; } });
Object.defineProperty(exports, "switchEthereum", { enumerable: true, get: function () { return neth_lib_1.switchEthereum; } });
Object.defineProperty(exports, "handleCheckAccount", { enumerable: true, get: function () { return neth_lib_1.handleCheckAccount; } });
Object.defineProperty(exports, "getNearMap", { enumerable: true, get: function () { return neth_lib_1.getNearMap; } });
Object.defineProperty(exports, "handleDisconnect", { enumerable: true, get: function () { return neth_lib_1.handleDisconnect; } });
Object.defineProperty(exports, "handleUpdateContract", { enumerable: true, get: function () { return neth_lib_1.handleUpdateContract; } });
Object.defineProperty(exports, "handleRefreshAppKey", { enumerable: true, get: function () { return neth_lib_1.handleRefreshAppKey; } });
Object.defineProperty(exports, "hasAppKey", { enumerable: true, get: function () { return neth_lib_1.hasAppKey; } });
Object.defineProperty(exports, "signIn", { enumerable: true, get: function () { return neth_lib_1.signIn; } });
Object.defineProperty(exports, "signOut", { enumerable: true, get: function () { return neth_lib_1.signOut; } });
Object.defineProperty(exports, "isSignedIn", { enumerable: true, get: function () { return neth_lib_1.isSignedIn; } });
Object.defineProperty(exports, "signAndSendTransactions", { enumerable: true, get: function () { return neth_lib_1.signAndSendTransactions; } });
Object.defineProperty(exports, "initConnection", { enumerable: true, get: function () { return neth_lib_1.initConnection; } });
