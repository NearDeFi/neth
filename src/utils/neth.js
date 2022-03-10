import { ethers } from "ethers";

const domain = {
    name: "NETH",
    version: "1",
    chainId: 1313161554, // aurora
}
/// helper gens the args for each call
export const ethSignJson = async (signer, json) => {
	const types = {
		Transaction: []
	}
	Object.entries(json).forEach(([k, v]) => {
		types.Transaction.push({
			type: 'string',
			name: k,
		})
	})
	if (json.actions) json.actions = JSON.stringify(json.actions)

	const sig = await signer._signTypedData(domain, types, json);

	return sig
};

export const keyPairFromEthSig = async (signer, json) => {

	json = {
		receiver_id: 'testnet',
		nonce: '1',
		actions: [{
			hello: 'world!',
			something: 'really really really really really long',
			somethingElse: 'really really really really really long',
		}]
	}
	
	const sig = await ethSignJson(signer, json)

	console.log(sig)



	let sigHash = ethers.utils.id(sig);
	/// use 32 bytes of entropy from the signature of the above message to create a NEAR keyPair
	return generateSeedPhrase(sigHash.substring(2, 34));
}