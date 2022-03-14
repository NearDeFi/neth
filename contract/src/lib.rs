#![no_std]
#![feature(core_intrinsics)]
#![feature(alloc_error_handler)]

const ECRECOVER_MESSAGE_SIZE: u64 = 32;
const ECRECOVER_SIGNATURE_LENGTH: u64 = 64;
const ECRECOVER_MALLEABILITY_FLAG: u64 = 1;
const ADDRESS_KEY: &str = "a";
const NONCE_KEY: &str = "n";
const NONCE_APP_KEY: &str = "k";
const REGISTER_0: u64 = 0;
const REGISTER_1: u64 = 1;
const REGISTER_2: u64 = 2;
const DOUBLE_QUOTE_BYTE: u8 = "\"".as_bytes()[0];
const RECEIVER_ID: &str = "receiver_id";
const PUBLIC_KEY: &str = "public_key";
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

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[panic_handler]
#[no_mangle]
pub unsafe fn on_panic(_info: &::core::panic::PanicInfo) -> ! {
    ::core::intrinsics::abort();
}

#[alloc_error_handler]
#[no_mangle]
pub unsafe fn on_alloc_error(_: core::alloc::Layout) -> ! {
    ::core::intrinsics::abort();
}

#[no_mangle]
pub unsafe fn setup() {
	assert_predecessor();
	input(REGISTER_0);
	let (_, data) = rread(REGISTER_0);
	swrite(ADDRESS_KEY, hex::decode(&get_string(&data, "address")[2..]).unwrap());
	let nonce: u64 = 0;
	swrite(NONCE_KEY, nonce.to_le_bytes().to_vec());
	swrite(NONCE_APP_KEY, nonce.to_le_bytes().to_vec());
}

#[no_mangle]
pub unsafe fn execute() {
	assert_predecessor();
	//increase nonce
	let nonce = sread_u64(NONCE_KEY);
	let new_nonce = nonce + 1;
	swrite(NONCE_KEY, new_nonce.to_le_bytes().to_vec());

	let data = assert_valid_tx(nonce);

	// log(&from_utf8_unchecked(&data));

	let receiver_id = get_string(&data, RECEIVER_ID);
	let actions = get_actions(&data);

	let id = promise_batch_create(receiver_id.len() as u64, receiver_id.as_ptr() as u64);
	
	for action in actions {

		match from_utf8_unchecked(&get_string(&action, "type")) {
			"Transfer" => {
				let amount = get_u128(&action, "amount");
				promise_batch_action_transfer(
					id,
					amount.to_le_bytes().as_ptr() as u64
				);
			},
			"AddKey" => {
				let allowance = get_u128(&action, "allowance");
				let receiver_id = get_string(&action, RECEIVER_ID);
				let method_names = get_string(&action, "method_names");
				// NEAR ed25519 keys prepend 0 to 32 bytes of key (33 bytes len)
				let mut public_key = vec![0];
				public_key.extend_from_slice(&hex::decode(get_string(&action, PUBLIC_KEY)).unwrap());
				// special case
				// set app key nonce to the nonce in sig used for entropy for the app key keypair
				// apps call get_app_key_nonce and ask for signature during sign in
				predecessor_account_id(REGISTER_1);
       			let (_, predecessor_account) = rread(REGISTER_1);

				if receiver_id == predecessor_account && from_utf8_unchecked(&method_names) == "execute" {
					swrite(NONCE_APP_KEY, nonce.to_le_bytes().to_vec());
				}
				
				promise_batch_action_add_key_with_function_call(
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
			},
			"DeleteKey" => {
				let mut public_key = vec![0];
				public_key.extend_from_slice(&hex::decode(get_string(&action, PUBLIC_KEY)).unwrap());
				promise_batch_action_delete_key(
					id,
					public_key.len() as u64,
					public_key.as_ptr() as u64,
				);
			},
			"FunctionCall" => {
				let method_name = get_string(&action, "method_name");
				let args = hex::decode(get_string(&action, "args")).unwrap();
				let amount = get_u128(&action, "amount");
				let gas = get_u128(&action, "gas") as u64;
				promise_batch_action_function_call(
					id,
					method_name.len() as u64,
					method_name.as_ptr() as u64,
					args.len() as u64,
					args.as_ptr() as u64,
					amount.to_le_bytes().as_ptr() as u64,
					gas,
				);
			},
			_ => {

			}
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
