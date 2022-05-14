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
/// repeated string literals (reduce contract size, improve readability)
const DOUBLE_QUOTE_BYTE: u8 = b'\"';
const RECEIVER_ID: &str = "receiver_id\":\"";
const PUBLIC_KEY: &str = "public_key\":\"";
const AMOUNT: &str = "amount\":\"";
const NONCE: &str = "nonce\":\"";
const TRANSACTIONS: &str = "transactions\":\"";

extern crate alloc;

use alloc::vec;
use alloc::vec::Vec;

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
    let data = expect(alloc::str::from_utf8(&data).ok());
    swrite(ADDRESS_KEY, &hex_decode(&get_string(data, "address\":\"")[2..]));
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

	// validate msg payload and signature with current nonce
    let nonce = unsafe { sread_u64(NONCE_KEY) };
    let data = assert_valid_tx(nonce);

    // increase nonce
    let new_nonce = nonce + 1;
    swrite(NONCE_KEY, &new_nonce.to_le_bytes());

	let (_, mut transaction_data) = expect(data.split_once(TRANSACTIONS));
	transaction_data = &transaction_data[0..transaction_data.len()-2];
	let mut transactions: Vec<&str> = vec![];
	while transaction_data.len() > 0 {
		let length_bytes: usize = expect(transaction_data[4..16].parse().ok());
		transactions.push(&transaction_data[16..16+length_bytes]);
		transaction_data = &transaction_data[16+length_bytes..];


        unsafe {
            log("___");
            log("___");
            log(transaction_data);
            log("___");
            log("___");
        }

	}

	// keep track of promise ids for each tx
	let mut promises: Vec<u64> = vec![];

    for tx in transactions {

		let receiver_id = get_string(&tx, RECEIVER_ID);
		
		let (_, mut actions_data) = expect(tx.split_once("actions\":"));





    
    



		let mut actions: Vec<&str> = vec![];
		while actions_data.len() > 0 {
			let length_bytes: usize = expect(actions_data[4..16].parse().ok());
			actions.push(&actions_data[16..16+length_bytes]);
			actions_data = &actions_data[16+length_bytes..];
		}

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

		// execute all actions for this promise
		for action in actions {
			match get_string(action, "type\":\"").as_bytes() {
				b"Transfer" => {
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
					// not a full access key get rest of args
					let receiver_id = get_string(action, RECEIVER_ID);
					let method_names = get_string(action, "method_names\":\"");
					// special case
					// set app key nonce to the nonce in sig used for entropy for the app key keypair
					// apps call get_app_key_nonce and ask for signature during sign in
					unsafe { near_sys::predecessor_account_id(TEMP_REGISTER) };
					let predecessor_account = register_read(TEMP_REGISTER);
					if receiver_id.as_bytes() == predecessor_account && method_names == "execute" {
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
					let method_name = get_string(action, "method_name\":\"");
					let args = hex_decode(&get_string(action, "args\":\""));
					let amount = get_u128(action, AMOUNT);
					let gas = get_u128(action, "gas\":\"") as u64;
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
				b"DeployContract" => {
					let code = hex_decode(&get_string(action, "code\":\""));
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
		}
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
    fn test_get_empty_string() {
        let str = get_string("\"args\":\"\"", "args\":\"");
        assert_eq!(str, "");
    }

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

    #[test]
    fn test_empty_args() {
        let str = get_string("\"args\":\"\"", "args\":\"");
        let decoded = hex_decode(&str);
        assert_eq!(decoded.len(), 0);
    }
}
