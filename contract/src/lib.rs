#![cfg_attr(target_arch = "wasm32", no_std)]
#![cfg_attr(
    all(target_arch = "wasm32", feature = "oom-handler"),
    feature(alloc_error_handler)
)]

const ECRECOVER_MESSAGE_SIZE: u64 = 32;
const ECRECOVER_SIGNATURE_LENGTH: u64 = 64;
const ECRECOVER_MALLEABILITY_FLAG: u64 = 1;
const ADDRESS_KEY: &str = "a";
const NONCE_KEY: &str = "n";
const NONCE_APP_KEY: &str = "k";
const REGISTER_0: u64 = 0;
const REGISTER_1: u64 = 1;
const REGISTER_2: u64 = 2;
const DOUBLE_QUOTE_BYTE: u8 = b'\"';
const RECEIVER_ID: &str = "receiver_id";
const PUBLIC_KEY: &str = "public_key";
const AMOUNT: &str = "amount";
const NONCE: &str = "nonce";
const ACTIONS: &str = "actions\":\"";

extern crate alloc;

use alloc::str::from_utf8_unchecked;
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

#[no_mangle]
pub unsafe fn setup() {
    assert_predecessor();
    near_sys::input(REGISTER_0);
    let data = rread(REGISTER_0);
    swrite(
        ADDRESS_KEY,
        &hex::decode(&get_string(&data, "address")[2..]).unwrap(),
    );
    let nonce: u64 = 0;
    swrite(NONCE_KEY, &nonce.to_le_bytes());
    swrite(NONCE_APP_KEY, &nonce.to_le_bytes());
}

#[no_mangle]
pub unsafe fn remove_storage() {
    assert_predecessor();
    near_sys::storage_remove(
        ADDRESS_KEY.len() as u64,
        ADDRESS_KEY.as_ptr() as u64,
        REGISTER_0,
    );
    near_sys::storage_remove(
        NONCE_KEY.len() as u64,
        NONCE_KEY.as_ptr() as u64,
        REGISTER_0,
    );
    near_sys::storage_remove(
        NONCE_APP_KEY.len() as u64,
        NONCE_APP_KEY.as_ptr() as u64,
        REGISTER_0,
    );
}

#[no_mangle]
pub unsafe fn execute() {
    assert_predecessor();
    //increase nonce
    let nonce = sread_u64(NONCE_KEY);
    let new_nonce = nonce + 1;
    swrite(NONCE_KEY, &new_nonce.to_le_bytes());

    let data = assert_valid_tx(nonce);

    // log(&from_utf8_unchecked(&data));

    let receiver_id = get_string(&data, RECEIVER_ID);
    let actions = get_actions(&data);

    let id = near_sys::promise_batch_create(receiver_id.len() as u64, receiver_id.as_ptr() as u64);

    for action in actions {
        match from_utf8_unchecked(&get_string(&action, "type")) {
            "Transfer" => {
                let amount = get_u128(&action, AMOUNT);
                near_sys::promise_batch_action_transfer(id, amount.to_le_bytes().as_ptr() as u64);
            }
            "AddKey" => {
                // NEAR ed25519 keys prepend 0 to 32 bytes of key (33 bytes len)
                let mut public_key = vec![0];
                public_key
                    .extend_from_slice(&hex::decode(get_string(&action, PUBLIC_KEY)).unwrap());
                // special case: allowance 0 means full access key, user would never want to add key with 0 allowance
                let allowance = get_u128(&action, "allowance");
                if allowance == 0 {
                    near_sys::promise_batch_action_add_key_with_full_access(
                        id,
                        public_key.len() as u64,
                        public_key.as_ptr() as u64,
                        0,
                    );
                    return;
                }
                // not a full access key get rest of args
                let receiver_id = get_string(&action, RECEIVER_ID);
                let method_names = get_string(&action, "method_names");
                // special case
                // set app key nonce to the nonce in sig used for entropy for the app key keypair
                // apps call get_app_key_nonce and ask for signature during sign in
                near_sys::predecessor_account_id(REGISTER_1);
                let predecessor_account = rread(REGISTER_1);
                if receiver_id == predecessor_account
                    && from_utf8_unchecked(&method_names) == "execute"
                {
                    swrite(NONCE_APP_KEY, &nonce.to_le_bytes());
                }

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
            "DeleteKey" => {
                let mut public_key = vec![0];
                public_key
                    .extend_from_slice(&hex::decode(get_string(&action, PUBLIC_KEY)).unwrap());
                near_sys::promise_batch_action_delete_key(
                    id,
                    public_key.len() as u64,
                    public_key.as_ptr() as u64,
                );
            }
            "FunctionCall" => {
                let method_name = get_string(&action, "method_name");
                let args = hex::decode(get_string(&action, "args")).unwrap();
                let amount = get_u128(&action, AMOUNT);
                let gas = get_u128(&action, "gas") as u64;
                near_sys::promise_batch_action_function_call(
                    id,
                    method_name.len() as u64,
                    method_name.as_ptr() as u64,
                    args.len() as u64,
                    args.as_ptr() as u64,
                    amount.to_le_bytes().as_ptr() as u64,
                    gas,
                );
            }
            "DeployContract" => {
                let code = hex::decode(get_string(&action, "code")).unwrap();
                near_sys::promise_batch_action_deploy_contract(
                    id,
                    code.len() as u64,
                    code.as_ptr() as u64,
                )
            }
            _ => {}
        };
    }
}

/// views

#[no_mangle]
pub unsafe fn get_address() {
    let mut address = vec![48, 120];
    address.extend_from_slice(hex::encode(&sread(ADDRESS_KEY)).as_bytes());
    return_bytes(&address);
}

#[no_mangle]
pub unsafe fn get_nonce() {
    return_bytes(hex::encode(sread_u64(NONCE_KEY).to_be_bytes()).as_bytes());
}

#[no_mangle]
pub unsafe fn get_app_key_nonce() {
    return_bytes(hex::encode(sread_u64(NONCE_APP_KEY).to_be_bytes()).as_bytes());
}

/// tests

#[cfg(test)]
mod tests {
    // Note this useful idiom: importing names from outer (for mod tests) scope.
    use super::*;

    #[test]
    fn test_get_empty_string() {
        unsafe {
            let str = get_string("\"args\":\"\"".as_bytes(), "args");
            assert_eq!(str, vec![]);
        }
    }

    #[test]
    fn test_get_empty_amount() {
        unsafe {
            let amount = get_u128("\"amount\":\"0\"".as_bytes(), "amount");
            assert_eq!(amount, 0);
        }
    }

    #[test]
    fn test_hex_empty_decode() {
        let decoded = hex::decode(vec![]).unwrap();
        assert_eq!(decoded.len(), 0);
    }

    #[test]
    fn test_empty_args() {
        unsafe {
            let str = get_string("\"args\":\"\"".as_bytes(), "args");
            let decoded = hex::decode(str).unwrap();
            assert_eq!(decoded.len(), 0);
        }
    }
}
