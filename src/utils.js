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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fundSecretsFromFile = exports.fundSecretsWithEth = exports.loadConsumableDumpFromFile = exports.saveSecrets = exports.saveConsumableDumpToFile = exports.generateSecrets = exports.generateTree = exports.generateWallets = exports.encode = void 0;
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
const fundSecretsWithEth = (secrets, funderPrivateKey, chainId, rpcUrl, amount // Amount of ETH to send to each wallet (in ETH, not Wei)
) => __awaiter(void 0, void 0, void 0, function* () {
    const provider = new ethers_1.JsonRpcProvider(rpcUrl, { chainId });
    const funder = new ethers_1.Wallet(funderPrivateKey, provider);
    const amountWei = (0, ethers_1.parseEther)(amount);
    console.log(`Funding ${secrets.length} wallets with ${amount} ETH each`);
    const promises = secrets.map((secret, index) => __awaiter(void 0, void 0, void 0, function* () {
        const { privateKey } = JSON.parse(Buffer.from(secret, 'base64').toString('utf-8'));
        const recipientWallet = new ethers_1.Wallet(privateKey, provider);
        console.log(`Funding wallet ${index + 1}: ${recipientWallet.address}`);
        const tx = yield funder.sendTransaction({
            to: recipientWallet.address,
            value: amountWei
        });
        yield tx.wait();
        console.log(`Funded wallet ${index + 1}: ${recipientWallet.address} with ${amount} ETH`);
    }));
    try {
        yield Promise.all(promises);
        console.log("All wallets funded successfully");
    }
    catch (error) {
        console.error("Error funding wallets:", error);
        throw error;
    }
});
exports.fundSecretsWithEth = fundSecretsWithEth;
const fundSecretsFromFile = (fileName, funderPrivateKey, chainId, rpcUrl, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const { pks } = JSON.parse((0, fs_1.readFileSync)(fileName, "utf8"));
    yield (0, exports.fundSecretsWithEth)(pks, funderPrivateKey, chainId, rpcUrl, amount);
});
exports.fundSecretsFromFile = fundSecretsFromFile;
