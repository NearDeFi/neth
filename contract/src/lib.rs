#![no_std]
#![feature(core_intrinsics)]
#![feature(alloc_error_handler)]

const ECRECOVER_MESSAGE_SIZE: u64 = 32;
const ECRECOVER_SIGNATURE_LENGTH: u64 = 64;
const ECRECOVER_MALLEABILITY_FLAG: u64 = 1;
const ADDRESS_KEY: &str = "a";
const NONCE_KEY: &str = "n";
const INPUT_REGISTER_ID: u64 = 0;
const OUTPUT_REGISTER_1: u64 = 1;
const OUTPUT_REGISTER_2: u64 = 2;

extern crate alloc;

use alloc::str::from_utf8_unchecked;
use alloc::vec;
use alloc::vec::Vec;

mod sys;
use sys::*;
mod parse;
use parse::*;

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

/// Checks that sig of keccak("\x19Ethereum Signed Message:\n32", keccak(msg)) matches ethereum pubkey and returns msg bytes
unsafe fn assert_owner(nonce: u64) -> Vec<u8> {
	input(INPUT_REGISTER_ID);
	let (len, data) = rread(INPUT_REGISTER_ID);

	let mut sig_bytes = hex::decode(&data[10..140]).unwrap();
	sig_bytes[64] = sig_bytes[64] - 27;
	let msg = &data[148..len - 1];
	// log(&msg);

	// create ethereum signed message hash
	let mut msg_wrapped = Vec::new();
	msg_wrapped.extend_from_slice("\x19Ethereum Signed Message:\n32".as_bytes());
	
	write_register(INPUT_REGISTER_ID, msg.len() as u64, msg.as_ptr() as u64);
	keccak256(u64::MAX, INPUT_REGISTER_ID, OUTPUT_REGISTER_2);
	let (_, keccak_hash_1) = rread(OUTPUT_REGISTER_2);
	
	msg_wrapped.extend_from_slice(keccak_hash_1.as_slice());
	
	write_register(INPUT_REGISTER_ID, msg_wrapped.len() as u64, msg_wrapped.as_ptr() as u64);
	keccak256(u64::MAX, INPUT_REGISTER_ID, OUTPUT_REGISTER_2);
	let (_, keccak_hash_2) = rread(OUTPUT_REGISTER_2);
	
	let result = ecrecover(
		ECRECOVER_MESSAGE_SIZE,
		keccak_hash_2.as_ptr() as u64,
		ECRECOVER_SIGNATURE_LENGTH,
		sig_bytes.as_ptr() as u64,
		sig_bytes[64] as u64,
		ECRECOVER_MALLEABILITY_FLAG,
		OUTPUT_REGISTER_1,
	);

	if result == (true as u64) {
		keccak256(u64::MAX, OUTPUT_REGISTER_1, OUTPUT_REGISTER_2);
		let (_, keccak_hash_bytes) = rread(OUTPUT_REGISTER_2);
		let address_bytes = keccak_hash_bytes[12..].to_vec();
		let address_bytes_storage = sread(ADDRESS_KEY);
		if address_bytes != address_bytes_storage {
			panic();
		}

		let nonce_msg = get_u128(&msg, "nonce");
		if nonce != nonce_msg as u64 {
			panic();
		}

		Vec::from(msg)
	} else {
		panic();
		vec![]
	}
}

#[no_mangle]
pub unsafe fn set_address() {
	input(INPUT_REGISTER_ID);
	let (_, data) = rread(INPUT_REGISTER_ID);
	swrite(ADDRESS_KEY, hex::decode(&get_string(&data, "address")).unwrap());
	let nonce: u64 = 0;
	swrite(NONCE_KEY, nonce.to_le_bytes().to_vec());
}

#[no_mangle]
pub unsafe fn get_address() {
	return_bytes(hex::encode(&sread(ADDRESS_KEY)).as_bytes());
}

#[no_mangle]
pub unsafe fn get_nonce() {
	return_bytes(hex::encode(sread_u64(NONCE_KEY).to_be_bytes()).as_bytes());
}

#[no_mangle]
pub unsafe fn execute() {
	let nonce = increase_nonce();
	let data = assert_owner(nonce);

	let receiver_id = get_string(&data, "receiver_id");
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
				let receiver_id = get_string(&action, "receiver_id");
				let method_names = get_string(&action, "method_names");
				let mut public_key = vec![0];
				public_key.extend_from_slice(&hex::decode(get_string(&action, "public_key")).unwrap());
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
				public_key.extend_from_slice(&hex::decode(get_string(&action, "public_key")).unwrap());
				promise_batch_action_delete_key(
					id,
					public_key.len() as u64,
					public_key.as_ptr() as u64,
				);
			},
			"FunctionCall" => {
				let method_name = get_string(&action, "method_name");
				let args = get_json(&action, "args");
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

/// utils

unsafe fn increase_nonce() -> u64 {
	let nonce = sread_u64(NONCE_KEY);
	let new_nonce = nonce + 1;
	swrite(NONCE_KEY, new_nonce.to_le_bytes().to_vec());
	nonce
}

// fn assert_predecessor() {
//     unsafe {
//         current_account_id(0);
//         let current_account = vec![0u8; register_len(0) as usize];
//         read_register(0, current_account.as_ptr() as *const u64 as u64);
//         predecessor_account_id(1);
//         let mut predecessor_account = vec![0u8; (register_len(1) + 1) as usize];
//         predecessor_account[0] = b'.';
//         read_register(1, predecessor_account[1..].as_ptr() as *const u64 as u64);
//         if !current_account.ends_with(&predecessor_account) {
//             panic();
//         }
//     }
// }
