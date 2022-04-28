# NEAR Accounts controlled by Ethereum signatures

This is a minimal no-std contract that can be deployed to a NEAR account and allows an Ethereum keypair to control it via signing payloads.

## Detail on User Flows

https://docs.google.com/document/d/1qcYWr6THYY9wibZNTxPhzjb1_aKaNIUL0l1cU9fuYu0/edit?usp=sharing

## Live Examples

React app (from this repo) to create and connect account:
https://neardefi.github.io/near-eth

GuestBook app with wallet-selector + MetaMask support:
https://neardefi.github.io/wallet-selector/

## Warning 🚨🚨🚨

This is functioning, but unaudited and incomplete.

## Dependencies

The tests and examples are using `ethers.js`

## Running Tests

`yarn && yarn test-build`

If you need a new dev account: `yarn test-deploy`

See: `test/contract.test.js` for details on how to deploy and call the contract from a client.

## Running Sample Client App

`yarn && yarn start`

The client app should open.

1. Choose an ethereum account
2. Choose a NEAR account ID (testnet)
3. (open console) Follow the deployment steps
4. Should receive alert
5. (optional) Check account will run checks making sure connection was successful, if not it will complete steps
6. Final step removes full access key for unlimited allowance access key for execute on contract
7. Try sign in/out and test transaction

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

*note: args for FunctionCall are hex encoded, **WITH 0x***

e.g.

```
const obj2hex = (obj) => ethers.utils.hexlify(new TextEncoder().encode(JSON.stringify(obj)))
...
nonce: 42
transactions: [
	{
		receiver_id: 'testnet',
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
	}
]
...
// "args":"0x7b226e65775f6163636f756e745f6964223a226d656f772d313634363433393030363738312e746573746e6574222c226e65775f7075626c69635f6b6579223a22656432353531393a327677456d413535376a586352576a6771314c393252435244756d4d36474359705567414e62793867534433227d"
```

### Actions

There are 5 types of actions:
1. Transfer
2. AddKey
3. DeleteKey
4. FunctionCall
5. DeployContract

They can be batched in a json array, but there can only be 1 receiver_id for all actions.

For details on how to call them, see: `test/contract.test.js`

## AddKey, DeleteKey, FunctionCall

The NEAR `public_key` and `args` arguments must be hex encoded **WITHOUT 0x**

e.g. for public key it's hex 64 length string (32 bytes)

Example:
```
nonce: 42
transactions: [
	{
		receiver_id: 'someaccount.testnet',
		actions: [
			...,
			{
				type: 'DeleteKey',
				public_key: '1caccbcbb9850c9d4a0d4a1888b346f5584cc1f6347472b107138f08de34e1c6',
			},
			{
				type: 'FunctionCall',
				args: 'd4a1888b346f5584cc1f6347472b107138f01caccbcbb9850c9d4a0d4a1888b346f5584cc1f6347472b107138f08de34e1c66347472b107138',
				...,
			},
			...,
		]
	}
]
```

## AddKey Special Case for Full Access Key

In order to add back a full access key to the account, the client specifies an allowance of 0.

Normally, for unlimited access key, a null allowance is used. An allowance of 0 means the key is useless.

We take this allowance 0 as a special flag meaning this key should be a full access key and add one to the account.

Contract:
```
// special case: allowance 0 means full access key, user would never want to add key with 0 allowance
let allowance = get_u128(action, "allowance\":\"");
if allowance == 0 {
	unsafe {
		near_sys::promise_batch_action_add_key_with_full_access(
			id,
			public_key.len() as u64,
			public_key.as_ptr() as u64,
			0,
		)
	};
	return;
}
```

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
values.extend_from_slice(&hash(&nonce_msg_str));
values.extend_from_slice(&hash(&transactions));
msg_wrapped.extend_from_slice(&hash(&values));
let msg_hash = hash(&msg_wrapped);

// then ecrecover with signature
```
