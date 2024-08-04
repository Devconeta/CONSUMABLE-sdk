"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSecretsCommand = exports.generateWalletsCommand = void 0;
const utils_1 = require("./src/utils");
const commander_1 = require("commander");
const ethers_1 = require("ethers");
// Primero: crear las wallets y crear el merkle tree con las addresses, el cual se lo damos al 
// dev para que deployee el contrato. Al mismo tiempo, guardamos las private keys en un 
// file para su uso como secrets en el stage 2
// Creamos una funcion para esta stage1 la cual no recibe ningun parametro
const generateWalletsCommand = (amount, filename) => {
    const wallets = (0, utils_1.generateWallets)(amount);
    const tree = (0, utils_1.generateTree)(wallets);
    return (0, utils_1.saveConsumableDumpToFile)(wallets, tree, filename);
};
exports.generateWalletsCommand = generateWalletsCommand;
const generateSecretsCommand = (dumpFilename, contractAddress, methodName, methodArgs, chainId) => {
    const { wallets, tree, } = (0, utils_1.loadConsumableDumpFromFile)(dumpFilename);
    const secrets = (0, utils_1.generateSecrets)(tree, wallets, contractAddress, methodName, methodArgs, chainId);
    (0, utils_1.saveSecrets)(secrets);
    return {
        secrets,
    };
};
exports.generateSecretsCommand = generateSecretsCommand;
const program = new commander_1.Command();
program
    .version("1.0.0")
    .description("CLI for generating the tree, wallets and secrets for Consumable contracts")
    .parse(process.argv);
program.command("generateWallets")
    .description("Generate wallets and save them to a file")
    .argument("<amount>", "Amount of wallets to create")
    .argument('[filename]', "Name of the file to save the private keys", undefined)
    .action((amount, filename) => {
    const numWallets = parseInt(amount, 10);
    if (isNaN(numWallets)) {
        console.error("Amount must be a valid number");
        return;
    }
    try {
        const savedFilename = (0, exports.generateWalletsCommand)(numWallets, filename || `wallets_${Date.now()}.json`);
        console.log(`Wallets saved to: ${savedFilename}`);
    }
    catch (error) {
        console.error("Error generating wallets:", error);
    }
});
program.command("generateSecrets")
    .description("Generate secrets based on the wallets and tree input file")
    .argument("<dumpFilename>", "Private keys dump file")
    .argument("<chainId>", "Contract chain id")
    .argument("<contractAddress>", "Consumable contract address")
    .argument("<methodSignature>", "onlyConsumer method signature")
    .action((dumpFilename, chainId, contractAddress, methodSignature) => {
    const parsedSignature = new ethers_1.Interface([`function ${methodSignature}`]);
    const functionFragment = parsedSignature.getFunction(methodSignature.split('(')[0]);
    const methodName = (functionFragment === null || functionFragment === void 0 ? void 0 : functionFragment.name) || '';
    const methodArguments = (functionFragment === null || functionFragment === void 0 ? void 0 : functionFragment.inputs.map((input) => ({
        name: input.name,
        type: input.type,
    }))) || [];
    const secrets = (0, exports.generateSecretsCommand)(dumpFilename, contractAddress, methodName, methodArguments, chainId);
    console.log(secrets);
});
program.parse();