#![cfg_attr(target_arch = "wasm32", no_std)]
#![cfg_attr(target_arch = "wasm32", feature(alloc_error_handler))]

/// contants related to ecrecover
const ECRECOVER_MESSAGE_SIZE: u64 = 32;
const ECRECOVER_SIGNATURE_LENGTH: u64 = 64;
const ECRECOVER_MALLEABILITY_FLAG: u64 = 1;
/// storage keys used by this contract because it uses raw storage key value writes and reads
const ADDRESS_KEY: &[u8] = b"a";
const NONCE_KEY: &[u8] = b"n";
const NONCE_APP_KEY: &[u8] = b"k";
/// register constants used
const TEMP_REGISTER: u64 = 0;
const REGISTER_1: u64 = 1;
/// string literals (improve readability)
const DOUBLE_QUOTE_BYTE: u8 = b'\"';
const ZERO_X: &str = "0x";
const EXECUTE: &str = "execute";
/// string literals in action payload parsing (improve readability)
const ARG_PREFIX: &str = "|NETH_";
const RECEIVER_ID: &str = "|NETH_receiver_id:";
const PUBLIC_KEY: &str = "|NETH_public_key:";
const AMOUNT: &str = "|NETH_amount:";
const TYPE: &str = "|NETH_type:";
const ALLOWANCE: &str = "|NETH_allowance:";
const METHOD_NAMES: &str = "|NETH_method_names:";
const METHOD_NAME: &str = "|NETH_method_name:";
const ARGS: &str = "|NETH_args:";
const GAS: &str = "|NETH_gas:";
const CODE: &str = "|NETH_code:";
const RECEIVER_MARKER: &str = "|~-_NETH~-_-~RECEIVER_-~|";
const ARG_SUFFIX: &str = "_NETH|";
/// json stringified payload from borsh
const ADDRESS: &str = "address\":\"0x";
const NONCE: &str = "nonce\":\"";
const RECEIVERS: &str = "receivers\":\"";
const TRANSACTIONS: &str = "transactions\":\"";
/// msg syntax adds a header for each transaction and action e.g. NETH00000100 where 00000100 is size of payload
const HEADER_OFFSET: usize = 4;
const HEADER_SIZE: usize = 12;
const PAYLOAD_START: usize = 14;

extern crate alloc;

/// DEBUGGING REMOVE
// use alloc::format;

use alloc::vec;
use alloc::vec::Vec;
use alloc::string::ToString;

mod sys;
use sys::*;
mod parse;
use parse::*;
mod owner;
use owner::*;

#[cfg(target_arch = "wasm32")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[cfg(target_arch = "wasm32")]
#[panic_handler]
#[no_mangle]
pub unsafe fn on_panic(_info: &::core::panic::PanicInfo) -> ! {
    core::arch::wasm32::unreachable()
}

#[cfg(target_arch = "wasm32")]
#[alloc_error_handler]
#[no_mangle]
pub unsafe fn on_alloc_error(_: core::alloc::Layout) -> ! {
    core::arch::wasm32::unreachable()
}

/// helps handle hex decode errors in one place
#[inline]
fn hex_decode(bytes: impl AsRef<[u8]>) -> Vec<u8> {
    expect(hex::decode(bytes).ok())
}

/// Helper function to panic on None types.
fn expect<T>(v: Option<T>) -> T {
    if cfg!(target_arch = "wasm32") {
        // Allowing because false positive
        #[allow(clippy::redundant_closure)]
        v.unwrap_or_else(|| sys::panic())
    } else {
        v.unwrap()
    }
}

/// Helper function to check arg bounds and count on payload
fn check_args_count(args: &str, count: usize) {
	if args.matches(ARG_PREFIX).count() != count || args.matches(ARG_SUFFIX).count() != count {
		sys::panic();
	}
}

/// This method allows a users (with a full NEAR access key) to initialize
/// their contract with the ethereum address they wish to use to control is via eth typed signed data.
/// 
/// args: stringified JSON e.g. `{ address: string }`
/// 
/// This method also sets the nonce and nonce for the app key to 0.
/// 
/// This method may be called again if the contract is redeployed.
/// In this case the storage for all 3 keys would have been deleted when the contract was removed.
#[no_mangle]
pub fn setup() {
    assert_predecessor();
    unsafe { near_sys::input(TEMP_REGISTER) };
    let data = register_read(TEMP_REGISTER);
	let (_, address) = expect(expect(alloc::str::from_utf8(&data).ok()).split_once(ADDRESS));
    swrite(ADDRESS_KEY, &hex_decode(&address[0..address.len()-2]));
    let nonce: u64 = 0;
    swrite(NONCE_KEY, &nonce.to_le_bytes());
    swrite(NONCE_APP_KEY, &nonce.to_le_bytes());
}

/// When a user no longer wishes to control their account, they will call execute
/// with a payload to add a full access key to their account (usually provided with a seed phrase on the client side).
/// 
/// This method cleans up the 3 storage keys that store the ethereum address, nonce and app key nonce.
#[no_mangle]
pub fn remove_storage() {
    assert_predecessor();
    unsafe {
        near_sys::storage_remove(
            ADDRESS_KEY.len() as u64,
            ADDRESS_KEY.as_ptr() as u64,
            TEMP_REGISTER,
        );
        near_sys::storage_remove(
            NONCE_KEY.len() as u64,
            NONCE_KEY.as_ptr() as u64,
            TEMP_REGISTER,
        );
        near_sys::storage_remove(
            NONCE_APP_KEY.len() as u64,
            NONCE_APP_KEY.as_ptr() as u64,
            TEMP_REGISTER,
        );
    }
}

/// This method is the main interpreter of the eth typed data signed payload by the ethereum account.
/// First the predecessor is checked by assert_predecessor() in owner.rs to ensure only access keys originating from this NEAR account are calling.
/// Next the nonce and new nonce are read and computed from storage.
/// Finally the data is returned from assert_valid_tx(nonce) in owner.rs.
/// 
/// After these conditions are satisfied the method parses and executes the transaction payload.
/// 
/// For details on NEAR transactions and actions please refer to: https://nomicon.io/RuntimeSpec/, https://nomicon.io/RuntimeSpec/Actions
#[no_mangle]
pub fn execute() {
    assert_predecessor();

    let (nonce, data) = assert_valid_tx();

    // increase nonce
    let new_nonce = nonce + 1;
    swrite(NONCE_KEY, &new_nonce.to_le_bytes());

	let (_, receivers_data) = expect(data.split_once(RECEIVERS));
    let (mut receivers_data, _) = expect(receivers_data.split_once(TRANSACTIONS));
	receivers_data = &receivers_data[0..receivers_data.len()-3];
	let receivers_len: usize = expect(receivers_data[HEADER_OFFSET+3..HEADER_SIZE].parse().ok());
	let num_receivers: usize = expect(receivers_data[HEADER_OFFSET..HEADER_OFFSET+3].parse().ok());
	receivers_data = &receivers_data[PAYLOAD_START..PAYLOAD_START+receivers_len];
	let mut receivers: Vec<&str> = receivers_data.split(",").collect();
	if num_receivers != receivers.len() || receivers_len != receivers_data.len() {
		sys::panic();
	}

	let (_, mut transaction_data) = expect(data.split_once(TRANSACTIONS));
	transaction_data = &transaction_data[0..transaction_data.len()-2];

	let mut transaction_data_copy = transaction_data;


	let mut num_txs = 0;
	while transaction_data_copy.len() > 0 {
		let transaction_len: usize = expect(transaction_data_copy[HEADER_OFFSET..HEADER_SIZE].parse().ok());
		transaction_data_copy = &transaction_data_copy[PAYLOAD_START+transaction_len..];
		num_txs += 1;
	}
	if num_txs + transaction_data.matches(RECEIVER_MARKER).count() != receivers.len() {
		sys::panic();
	}

	// keep track of promise ids for each tx
	let mut promises: Vec<u64> = vec![];

	// execute transactions
	while transaction_data.len() > 0 {

		// will panic if len 0 (potentially malicious tx injected)
		let receiver_id = receivers.remove(0);
		// start new promise batch or chain with previous promise batch
		let id = if promises.len() == 0 {
			unsafe {
				near_sys::promise_batch_create(
					receiver_id.len() as u64,
					receiver_id.as_ptr() as u64
				)
			}
		} else {
			unsafe {
				near_sys::promise_batch_then(
					promises[promises.len() - 1],
					receiver_id.len() as u64,
					receiver_id.as_ptr() as u64
				)
			}
		};
		promises.push(id);

		// execute actions in transaction
		let transaction_len: usize = expect(transaction_data[HEADER_OFFSET..HEADER_SIZE].parse().ok());
		let mut actions_data = &transaction_data[PAYLOAD_START..PAYLOAD_START+transaction_len];


		while actions_data.len() > 0 {

			let action_len: usize = expect(actions_data[HEADER_OFFSET..HEADER_SIZE].parse().ok());
			let action = &actions_data[PAYLOAD_START..PAYLOAD_START+action_len];

			match get_string(action, TYPE).as_bytes() {
				b"Transfer" => {
					// type, amount
					check_args_count(action, 2);

					let amount = get_u128(action, AMOUNT);

					unsafe {
						near_sys::promise_batch_action_transfer(
							id,
							amount.to_le_bytes().as_ptr() as u64,
						)
					};
				}
				b"AddKey" => {
					// NEAR ed25519 keys prepend 0 to 32 bytes of key (33 bytes len)
					let mut public_key = vec![0];
					public_key.extend_from_slice(&hex_decode(&get_string(action, PUBLIC_KEY)));
					// special case: allowance 0 means full access key, user would never want to add key with 0 allowance
					let allowance = get_u128(action, ALLOWANCE);
					if allowance == 0 {
						// type, public_key, allowance
						check_args_count(action, 3);

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
					// not a full access key get rest of args
					// type, public_key, allowance, method_names, receiver_id
					check_args_count(action, 5);

					let method_names = get_string(action, METHOD_NAMES);
					let receiver_id = get_string(action, RECEIVER_ID);
					// special case
					// set app key nonce to the nonce in sig used for entropy for the app key keypair
					// apps call get_app_key_nonce and ask for signature during sign in
					unsafe { near_sys::predecessor_account_id(TEMP_REGISTER) };
					let predecessor_account = register_read(TEMP_REGISTER);
					if receiver_id.as_bytes() == predecessor_account && method_names == EXECUTE {
						swrite(NONCE_APP_KEY, &nonce.to_le_bytes());
					}

					unsafe {
						near_sys::promise_batch_action_add_key_with_function_call(
							id,
							public_key.len() as u64,
							public_key.as_ptr() as u64,
							0,
							allowance.to_le_bytes().as_ptr() as u64,
							receiver_id.len() as u64,
							receiver_id.as_ptr() as u64,
							method_names.len() as u64,
							method_names.as_ptr() as u64,
						)
					}
				}
				b"DeleteKey" => {
					// type, public_key
					check_args_count(action, 2);

					let mut public_key = vec![0];
					public_key.extend_from_slice(&hex_decode(&get_string(action, PUBLIC_KEY)));

					unsafe {
						near_sys::promise_batch_action_delete_key(
							id,
							public_key.len() as u64,
							public_key.as_ptr() as u64,
						)
					};
				}
				b"FunctionCall" => {
					// type, method_name, amount, gas, args
					check_args_count(action, 5);

					let method_name = get_string(action, METHOD_NAME);
					let amount = get_u128(action, AMOUNT);
					let gas = get_u128(action, GAS) as u64;
					// fill any functionCall args that matched account|receiver and were replaced by RECEIVER_MARKER
					// from the receivers list
					let mut args = get_string(action, ARGS).to_string();
					
					while args.matches(RECEIVER_MARKER).count() > 0 {
						let receiver_id = receivers.remove(0);
						args = args.replacen(RECEIVER_MARKER, receiver_id, 1);
					}

					if &args[0..2] == ZERO_X {
						let final_args = hex_decode(&args[2..]);
						unsafe {
							near_sys::promise_batch_action_function_call(
								id,
								method_name.len() as u64,
								method_name.as_ptr() as u64,
								final_args.len() as u64,
								final_args.as_ptr() as u64,
								amount.to_le_bytes().as_ptr() as u64,
								gas,
							)
						};
					} else {
						unsafe {
							near_sys::promise_batch_action_function_call(
								id,
								method_name.len() as u64,
								method_name.as_ptr() as u64,
								args.len() as u64,
								args.as_ptr() as u64,
								amount.to_le_bytes().as_ptr() as u64,
								gas,
							)
						};
					}
				}
				b"DeployContract" => {
					// type, code
					check_args_count(action, 2);

					let code = hex_decode(&get_string(action, CODE));

					unsafe {
						near_sys::promise_batch_action_deploy_contract(
							id,
							code.len() as u64,
							code.as_ptr() as u64,
						)
					}
				}
				_ => {}
			};

			// action_data read forward
			actions_data = &actions_data[PAYLOAD_START+action_len..];
		}

		// transaction_data read forward
		transaction_data = &transaction_data[PAYLOAD_START+transaction_len..];
    }

}

/// views

#[no_mangle]
pub(crate) unsafe fn get_address() {
    let mut address = hex::encode(&storage_read(ADDRESS_KEY));
    address.insert_str(0, "0x");
    return_bytes(address.as_bytes());
}

#[no_mangle]
pub(crate) unsafe fn get_nonce() {
    return_bytes(hex::encode(sread_u64(NONCE_KEY).to_be_bytes()).as_bytes());
}

#[no_mangle]
pub(crate) unsafe fn get_app_key_nonce() {
    return_bytes(hex::encode(sread_u64(NONCE_APP_KEY).to_be_bytes()).as_bytes());
}

/// minimal tests for edge cases only

#[cfg(test)]
mod tests {
    // Note this useful idiom: importing names from outer (for mod tests) scope.
    use super::*;

    #[test]
    fn test_get_empty_amount() {
        let amount = get_u128("\"amount\":\"0\"", "amount\":\"");
        assert_eq!(amount, 0);
        assert_eq!(ADDRESS_KEY.len(), 1);
    }

    #[test]
    fn test_hex_empty_decode() {
        let decoded = hex_decode("");
        assert_eq!(decoded.len(), 0);
    }

}
