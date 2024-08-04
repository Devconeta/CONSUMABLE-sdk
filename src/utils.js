"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConsumableDumpFromFile = exports.saveSecrets = exports.saveConsumableDumpToFile = exports.generateSecrets = exports.generateTree = exports.generateWallets = exports.encode = void 0;
const ethers_1 = require("ethers");
const merkle_tree_1 = require("@openzeppelin/merkle-tree");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const encode = (args) => {
    return Buffer.from(JSON.stringify(args)).toString('base64');
};
exports.encode = encode;
const generateWallets = (amount) => Array(amount).fill(0).map(() => ethers_1.Wallet.createRandom());
exports.generateWallets = generateWallets;
const generateTree = (wallets) => {
    const leaves = wallets.map(key => [key.address]);
    return merkle_tree_1.StandardMerkleTree.of(leaves, ['address']);
};
exports.generateTree = generateTree;
const generateSecrets = (tree, wallets, contractAddress, methodName, methodArgs, chainId) => {
    const secrets = wallets.map((wallet) => (0, exports.encode)({
        privateKey: wallet.privateKey,
        contractAddress,
        methodName,
        methodArgs,
        chainId,
        merkleProof: tree.getProof([wallet.address])
    }));
    (0, exports.saveSecrets)(secrets);
    return secrets;
};
exports.generateSecrets = generateSecrets;
const saveConsumableDumpToFile = (wallets, tree, fileName) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const content = JSON.stringify({
        tree: tree.dump(),
        pks: wallets.map((w) => w.privateKey)
    });
    const filePath = saveData('dump', fileName !== null && fileName !== void 0 ? fileName : `data_${timestamp}.json`, content);
    return filePath;
};
exports.saveConsumableDumpToFile = saveConsumableDumpToFile;
const saveSecrets = (secrets, fileName) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    return saveData('secrets', fileName !== null && fileName !== void 0 ? fileName : `data_${timestamp}.json`, JSON.stringify(secrets));
};
exports.saveSecrets = saveSecrets;
const saveData = (fileDir, fileName, data) => {
    const outputDir = path_1.default.join(process.cwd(), fileDir);
    if (!(0, fs_1.existsSync)(outputDir)) {
        (0, fs_1.mkdirSync)(outputDir);
    }
    const filePath = path_1.default.join(outputDir, fileName);
    (0, fs_1.writeFileSync)(filePath, data);
    return filePath;
};
const loadConsumableDumpFromFile = (fileName) => {
    const { tree: treeDump, pks } = JSON.parse((0, fs_1.readFileSync)(fileName, "utf8"));
    const wallets = pks.map((pk) => new ethers_1.Wallet(pk));
    const tree = merkle_tree_1.StandardMerkleTree.load(treeDump);
    return {
        wallets,
        tree,
    };
};
exports.loadConsumableDumpFromFile = loadConsumableDumpFromFile;
