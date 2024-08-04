"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Consumable = void 0;
class Consumable {
    constructor(base64Secret) {
        this.base64Secret = base64Secret;
    }
    consume() {
        const decodedSecret = Buffer.from(this.base64Secret, 'base64').toString('utf-8');
        const { privateKey, contractAddress, merkleProof, methodName, methodArgs, chainId } = JSON.parse(decodedSecret);
        return {
            contractAddress,
            chainId,
            methodName,
            methodArgs,
            merkleProof,
            privateKey,
        };
    }
}
exports.Consumable = Consumable;
