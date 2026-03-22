import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const networkMap = {
  testnet: Network.TESTNET,
  mainnet: Network.MAINNET,
  devnet:  Network.DEVNET,
};

const network = networkMap[process.env.NEXT_PUBLIC_APTOS_NETWORK] ?? Network.TESTNET;

const config = new AptosConfig({
  network,
  clientConfig: {
    API_KEY: process.env.NEXT_PUBLIC_APTOS_API_KEY,
  },
});

export const aptos = new Aptos(config);

const MODULE = process.env.NEXT_PUBLIC_MODULE_ADDRESS;

/**
 * Register a newly uploaded file in the on-chain registry.
 * Calls: file_share::registry::register_file
 *
 * @param {object} wallet  - connected Aptos wallet adapter
 * @param {object} params
 * @param {string} params.cid        - Shelby CID
 * @param {string} params.name       - original filename
 * @param {number} params.size       - bytes
 * @param {number} params.expiryTs   - Unix timestamp (seconds), 0 = never
 * @param {number} params.maxViews   - 0 = unlimited
 */
export async function registerFile(wallet, { cid, name, size, expiryTs, maxViews }) {
  const payload = {
    function: `${MODULE}::registry::register_file`,
    type_arguments: [],
    arguments: [cid, name, size.toString(), expiryTs.toString(), maxViews.toString()],
  };
  const response = await wallet.signAndSubmitTransaction({ payload });
  await aptos.waitForTransaction({ transactionHash: response.hash });
  return response.hash;
}

/**
 * Revoke on-chain access for a file.
 * Calls: file_share::registry::revoke_file
 *
 * @param {object} wallet
 * @param {string} cid
 */
export async function revokeFile(wallet, cid) {
  const payload = {
    function: `${MODULE}::registry::revoke_file`,
    type_arguments: [],
    arguments: [cid],
  };
  const response = await wallet.signAndSubmitTransaction({ payload });
  await aptos.waitForTransaction({ transactionHash: response.hash });
  return response.hash;
}

/**
 * Increment the view counter for a file.
 * Calls: file_share::registry::increment_views
 *
 * @param {object} wallet
 * @param {string} cid
 */
export async function incrementViews(wallet, cid) {
  const payload = {
    function: `${MODULE}::registry::increment_views`,
    type_arguments: [],
    arguments: [cid],
  };
  const response = await wallet.signAndSubmitTransaction({ payload });
  await aptos.waitForTransaction({ transactionHash: response.hash });
  return response.hash;
}

/**
 * Read a file record from the on-chain registry (view function, no gas).
 *
 * @param {string} ownerAddress
 * @param {string} cid
 * @returns {object|null}
 */
export async function getFileRecord(ownerAddress, cid) {
  try {
    const [record] = await aptos.view({
      payload: {
        function: `${MODULE}::registry::get_file`,
        type_arguments: [],
        arguments: [ownerAddress, cid],
      },
    });
    return record;
  } catch {
    return null;
  }
}
