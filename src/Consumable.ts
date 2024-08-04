import { ConsumableArguments } from "./types";

export class Consumable {
  private readonly base64Secret: string;

  constructor(base64Secret: string) {
    this.base64Secret = base64Secret;
  }

  public consume(): ConsumableArguments {
    const decodedSecret = Buffer.from(this.base64Secret, 'base64').toString('utf-8');
    const { privateKey, contractAddress, merkleProof, methodName, methodArgs, chainId } = JSON.parse(decodedSecret) as ConsumableArguments;

    return {
      contractAddress,
      chainId,
      methodName,
      methodArgs,
      merkleProof,
      privateKey,
    }
  }
}