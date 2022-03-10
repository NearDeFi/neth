# NEAR Accounts controlled by Ethereum signatures

This is a minimal no-std contract that can be deployed to a NEAR account and allows an Ethereum keypair to control it via signing payloads.

## Warning 🚨🚨🚨

This is functioning, but unaudited and incomplete.

## Running Tests

`yarn && yarn test-build`

If you need a new dev account: `yarn test-deploy`

See: `test/contract.test.js` for details on how to deploy and call the contract from a client.

## Initialization

`setup()`

- 1 argument
- `address` is the hex encoded Ethereum address **WITH 0x**

It will store address and a nonce (default 0) to protect against tx replay.

## Transactions

`execute()`

- 2 arguments
- `sig` is the hex encoded flat sig of the msg argument
- `msg` is stringified JSON of the TX request (https://github.com/near/core-contracts/tree/master/multisig#request)

### msg payload

**ALL ARGUMENTS ARE STRINGS**

There are no ints or numbers used in the msg payload!

*note: args for FunctionCall are hex encoded, including 0x*

e.g.

```
const obj2hex = (obj) => ethers.utils.hexlify(new TextEncoder().encode(JSON.stringify(obj)))
...
actions: [
	{
		type: 'FunctionCall',
		method_name: 'create_account',
		args: obj2hex({
			new_account_id: 'meow-' + Date.now() + '.testnet',
			new_public_key: publicKey,
		}),
		amount: parseNearAmount('0.02'),
		gas: '100000000000000',
	},
]
...
// "args":"0x7b226e65775f6163636f756e745f6964223a226d656f772d313634363433393030363738312e746573746e6574222c226e65775f7075626c69635f6b6579223a22656432353531393a327677456d413535376a586352576a6771314c393252435244756d4d36474359705567414e62793867534433227d"
```

### Actions

There are 4 types of actions:
1. Transfer
2. AddKey
3. DeleteKey
4. FunctionCall

They can be batched in a json array, but there can only be 1 receiver_id for all actions.

For details on how to call them, see: `test/contract.test.js`

## View Methods

- `get_address` returns the ethereum address for this account **WITH 0x**
- `get_nonce` returns the nonce to use for the next TX **PADDED HEX ENCODING**

### Parsing get_nonce response for TXs

Take the base16 int of `get_nonce` result and stringify it for usage.
```
const nonce = parseInt(await account.viewFunction(
	accountId,
	'get_nonce'
), 16).toString();
```

## Utilities

`parse.rs` includes rudimentary string parsing for the `msg` arg.
`sys.rs` handles the near-sys method definitions, storage and register ops.
`owner.rs` is where the signature is recovered and predecessor checked.

## Signatures

Follows:
https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md

Client side using ethers.js:
```
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
```
Contract:
```
// construct the message from the original JSON pieces, then hash it
let mut msg_wrapped = Vec::from(DOMAIN_HASH);
let mut values = Vec::from(TX_TYPE_HASH);
values.extend_from_slice(&hash(&receiver_id));
values.extend_from_slice(&hash(&nonce_msg_str));
values.extend_from_slice(&hash(&actions));
msg_wrapped.extend_from_slice(&hash(&values));
let msg_hash = hash(&msg_wrapped);

// then ecrecover with signature
```
