import { ethers } from "ethers";
import { config } from "../config.js";

export function createEthersWallet(): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(config.zgRpcUrl);
  const key = config.providerPrivateKey.startsWith("0x")
    ? config.providerPrivateKey
    : `0x${config.providerPrivateKey}`;
  return new ethers.Wallet(key, provider);
}
