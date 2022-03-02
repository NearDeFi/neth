#![no_std]
#![feature(core_intrinsics)]
#![feature(alloc_error_handler)]

extern crate alloc;

use alloc::vec;
use alloc::vec::Vec;

mod parse;
use parse::{ get_string };

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

const ECRECOVER_MESSAGE_SIZE: u64 = 32;
const ECRECOVER_SIGNATURE_LENGTH: u64 = 64;
const ECRECOVER_MALLEABILITY_FLAG: u64 = 1;
const INPUT_REGISTER_ID: u64 = 0;
const RECOVER_REGISTER_ID: u64 = 1;
const KECCACK_REGISTER_ID: u64 = 2;

#[allow(dead_code)]
extern "C" {
    fn read_register(register_id: u64, ptr: u64);
    fn write_register(register_id: u64, data_len: u64, data_ptr: u64);
    fn register_len(register_id: u64) -> u64;
    fn current_account_id(register_id: u64);
    fn predecessor_account_id(register_id: u64);
    fn input(register_id: u64);
    fn panic();
    fn log_utf8(len: u64, ptr: u64);
    fn promise_batch_create(account_id_len: u64, account_id_ptr: u64) -> u64;
    fn promise_batch_action_function_call(
        promise_index: u64,
        method_name_len: u64,
        method_name_ptr: u64,
        arguments_len: u64,
        arguments_ptr: u64,
        amount_ptr: u64,
        gas: u64,
    );
    fn promise_batch_action_deploy_contract(promise_index: u64, code_len: u64, code_ptr: u64);
    fn promise_batch_action_transfer(promise_index: u64, amount_ptr: u64);

	fn ecrecover(
		hash_len: u64,
        hash_ptr: u64,
        sig_len: u64,
        sig_ptr: u64,
        v: u64,
        malleability_flag: u64,
        register_id: u64,
	) -> u64;

	fn keccak256(value_len: u64, value_ptr: u64, register_id: u64);
}

#[allow(dead_code)]
fn log(message: &str) {
    unsafe {
        log_utf8(message.len() as _, message.as_ptr() as _);
    }
}

/// Checks that sig of keccak("\x19Ethereum Signed Message:\n32", keccak(msg)) matches ethereum pubkey and returns msg bytes
fn assert_owner() -> Vec<u8> {
    unsafe {
        input(INPUT_REGISTER_ID);
		let len = register_len(INPUT_REGISTER_ID) as usize;
        let data = vec![0u8; len];
        read_register(INPUT_REGISTER_ID, data.as_ptr() as *const u64 as u64);

		let mut sig_bytes = hex::decode(&data[10..140]).unwrap();
		sig_bytes[64] = sig_bytes[64] - 27;
		let msg = &data[148..len - 1];
		// log(&msg);

		// create ethereum signed message hash
		let mut msg_wrapped = Vec::new();
		msg_wrapped.extend_from_slice("\x19Ethereum Signed Message:\n32".as_bytes());
		
		write_register(INPUT_REGISTER_ID, msg.len() as u64, msg.as_ptr() as u64);
		keccak256(u64::MAX, INPUT_REGISTER_ID, KECCACK_REGISTER_ID);
		let keccak_hash_1 = [0u8; 32];
		read_register(KECCACK_REGISTER_ID, keccak_hash_1.as_ptr() as u64);
		
		msg_wrapped.extend_from_slice(keccak_hash_1.as_slice());
		
		write_register(INPUT_REGISTER_ID, msg_wrapped.len() as u64, msg_wrapped.as_ptr() as u64);
		keccak256(u64::MAX, INPUT_REGISTER_ID, KECCACK_REGISTER_ID);
		let keccak_hash_2 = [0u8; 32];
		read_register(KECCACK_REGISTER_ID, keccak_hash_2.as_ptr() as u64);
        
        let result = ecrecover(
            ECRECOVER_MESSAGE_SIZE,
            keccak_hash_2.as_ptr() as u64,
            ECRECOVER_SIGNATURE_LENGTH,
            sig_bytes.as_ptr() as u64,
            sig_bytes[64] as u64,
            ECRECOVER_MALLEABILITY_FLAG,
            RECOVER_REGISTER_ID,
        );

        if result == (true as u64) {
            keccak256(u64::MAX, RECOVER_REGISTER_ID, KECCACK_REGISTER_ID);
            let keccak_hash_bytes = [0u8; 32];
            read_register(KECCACK_REGISTER_ID, keccak_hash_bytes.as_ptr() as u64);
            let address = hex::encode(&keccak_hash_bytes[12..]);

			// TODO store owner in contract and check address matches
			log(&address);

			Vec::from(msg)
        } else {
			panic();
			vec![]
		}
    }
}

#[no_mangle]
pub extern "C" fn test() {
	let message_bytes = assert_owner();
	
	let action = get_string(&message_bytes, "action");
	
	log(&action);
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

// /// This proxies passed call.
// /// Checks that predecessor is suffix of the given account.
// /// <gas:64><amount:u128><receiver_len:u32><receiver_id:bytes><method_name_len:u32><method_name:bytes><args_len:u32><args:bytes>
// #[no_mangle]
// pub extern "C" fn call() {
//     assert_predecessor();
//     unsafe {
//         input(2);
//         let data = vec![0u8; register_len(2) as usize];
//         read_register(2, data.as_ptr() as *const u64 as u64);
//         let gas = slice_to_u64(&data[..8]);
//         let amount = &data[8..24]; // as u128;
//         let receiver_len = slice_to_u32(&data[24..28]) as usize;
//         let method_name_len = slice_to_u32(&data[28 + receiver_len..32 + receiver_len]) as usize;
//         let args_len = slice_to_u32(
//             &data[32 + receiver_len + method_name_len..36 + receiver_len + method_name_len],
//         ) as usize;
//         let id = promise_batch_create(receiver_len as _, data.as_ptr() as u64 + 28);
//         promise_batch_action_function_call(
//             id,
//             method_name_len as _,
//             data.as_ptr() as u64 + 32 + receiver_len as u64,
//             args_len as _,
//             data.as_ptr() as u64 + 36 + (receiver_len + method_name_len) as u64,
//             amount.as_ptr() as _,
//             gas,
//         );
//     }
// }

// /// Transfers given amount of $NEAR to given account.
// /// Input format <amount:u128><receiver_id:bytes>
// #[no_mangle]
// pub extern "C" fn transfer() {
//     assert_predecessor();
//     unsafe {
//         input(2);
//         let data = vec![0u8; register_len(2) as usize];
//         read_register(2, data.as_ptr() as *const u64 as u64);
//         let id = promise_batch_create((data.len() - 16) as _, data.as_ptr() as u64 + 16);
//         promise_batch_action_transfer(id, data.as_ptr() as _);
//     }
// }

// /// This allows to update the contract on this account.
// /// Checks that predecessor is suffix of the given account.
// #[no_mangle]
// pub extern "C" fn update() {
//     assert_predecessor();
//     unsafe {
//         let id = promise_batch_create(u64::MAX as _, 0 as _);
//         input(2);
//         promise_batch_action_deploy_contract(id, u64::MAX as _, 2 as _);
//     }
// }

// /// utils

// fn slice_to_u64(s: &[u8]) -> u64 {
//     let mut word = [0u8; 8];
//     word.copy_from_slice(s);
//     u64::from_le_bytes(word)
// }

// fn slice_to_u32(s: &[u8]) -> u32 {
//     let mut word = [0u8; 4];
//     word.copy_from_slice(s);
//     u32::from_le_bytes(word)
// }

// fn slice_to_u8(s: &[u8]) -> u8 {
//     let mut word = [0u8; 1];
//     word.copy_from_slice(s);
//     u8::from_le_bytes(word)
// }

// fn slice_to_bool(s: &[u8]) -> bool {
//     let mut word = [0u8; 1];
//     word.copy_from_slice(s);
//     if u8::from_le_bytes(word) == 1 {
// 		true
// 	} else {
// 		false
// 	}
// }