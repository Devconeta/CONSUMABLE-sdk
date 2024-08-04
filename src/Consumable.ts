import { ConsumableArguments } from "./types";
import { decode } from "./utils";

export class Consumable {
  private readonly base64Secret: string;

  constructor(base64Secret: string) {
    this.base64Secret = base64Secret;
  }

  public consume(): ConsumableArguments {
    const { privateKey, contractAddress, merkleProof, methodName, methodArgs, chainId } = decode(this.base64Secret) as ConsumableArguments;

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