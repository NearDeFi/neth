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

*note: args for FunctionCall are not Base64VecU8 (multisig contract), they are json!*

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

Using ethers.js:
```
const messageHash = ethers.utils.id(JSON.stringify(msg));
const messageHashBytes = ethers.utils.arrayify(messageHash);
const flatSig = await wallet.signMessage(messageHashBytes);
```

Most Ethereum clients take a digest of the signed message bytes, prepend `"\x19Ethereum Signed Message:\n32"`, and then `keccak256` this to get the hash for `ecrecover`.

Therefore, the contract takes in msg and performs the above hashes, then calls `ecrecover`

```
// create ethereum signed message hash
let mut msg_wrapped = Vec::new();
msg_wrapped.extend_from_slice("\x19Ethereum Signed Message:\n32".as_bytes());

write_register(REGISTER_0, msg.len() as u64, msg.as_ptr() as u64);
keccak256(u64::MAX, REGISTER_0, REGISTER_2);
let (_, keccak_hash_1) = rread(REGISTER_2);

msg_wrapped.extend_from_slice(keccak_hash_1.as_slice());

write_register(REGISTER_0, msg_wrapped.len() as u64, msg_wrapped.as_ptr() as u64);
keccak256(u64::MAX, REGISTER_0, REGISTER_2);
let (_, keccak_hash_2) = rread(REGISTER_2);
```
