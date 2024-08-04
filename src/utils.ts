import { HDNodeWallet, Wallet } from "ethers";
import { ConsumableArguments, ConsumableDump, MethodArgument } from "./types";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import path from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

export const encode = (args: ConsumableArguments) => {
  return Buffer.from(JSON.stringify(args)).toString('base64');
}

export const generateWallets = (amount: number): HDNodeWallet[] => Array(amount).fill(0).map(() => Wallet.createRandom())

export const generateTree = (wallets: HDNodeWallet[]): StandardMerkleTree<string[]> => {
  const leaves = wallets.map(key => [key.address]);
  return StandardMerkleTree.of(leaves, ['address']);
}

export const generateSecrets = (
  tree: StandardMerkleTree<string[]>,
  wallets: Wallet[],
  contractAddress: string,
  methodName: string,
  methodArgs: MethodArgument[],
  chainId: number
): string[] => {
  
  const secrets = wallets.map((wallet) => encode({
    privateKey: wallet.privateKey,
    contractAddress,
    methodName,
    methodArgs,
    chainId,
    merkleProof: tree.getProof([wallet.address])
  }));

  saveSecrets(secrets)

  return secrets;
}

export const saveConsumableDumpToFile = (
  wallets: HDNodeWallet[], 
  tree: StandardMerkleTree<any>,
  fileName?: string
): string => {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  
  const content = JSON.stringify({
    tree: tree.dump(),
    pks: wallets.map((w) => w.privateKey)
  })

  const filePath = saveData('dump', fileName ?? `data_${timestamp}.json`, content);

  return filePath;
}

export const saveSecrets = (secrets: string[], fileName?: string): string => {
  const timestamp = new Date().toISOString().replace(/:/g, '-');

  return saveData('secrets', fileName ?? `data_${timestamp}.json`, JSON.stringify(secrets));
}

const saveData = (fileDir: string, fileName: string, data: any): string => {
  const outputDir = path.join(process.cwd(), fileDir);
  if (!existsSync(outputDir)){
    mkdirSync(outputDir);
  }

  const filePath = path.join(outputDir, fileName);
  writeFileSync(filePath, data);

  return filePath;
}

export const loadConsumableDumpFromFile = (fileName: string): {
  wallets: Wallet[], 
  tree: StandardMerkleTree<any>
} => {
  const { tree: treeDump, pks } = JSON.parse(readFileSync(fileName, "utf8")) as ConsumableDump;
  const wallets = pks.map((pk) => new Wallet(pk));
  const tree = StandardMerkleTree.load(treeDump);
  return {
    wallets,
    tree,
  }
}