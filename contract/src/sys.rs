use crate::*;

// pub unsafe fn log(message: &str) {
//     log_utf8(message.len() as _, message.as_ptr() as _);
// }

pub unsafe fn return_bytes(bytes: &[u8]) {
	let mut ret_data = vec![DOUBLE_QUOTE_BYTE];
	ret_data.extend_from_slice(bytes);
	ret_data.push(DOUBLE_QUOTE_BYTE);
	value_return(ret_data.len() as u64, ret_data.as_ptr() as u64);
}

pub unsafe fn swrite(key: &str, val: Vec<u8>) {
	storage_write(
		key.len() as u64,
		key.as_ptr() as u64,
		val.len() as u64,
		val.as_ptr() as u64,
		REGISTER_0
	);
}

pub unsafe fn sread(key: &str) -> Vec<u8> {
	storage_read(
		key.len() as u64,
		key.as_ptr() as u64,
		REGISTER_0,
	);
	let (_, data) = rread(REGISTER_0);
	data
}

pub unsafe fn sread_u64(key: &str) -> u64 {
	let mut word = [0u8; 8];
	word.copy_from_slice(&sread(key));
    u64::from_le_bytes(word)
}

pub unsafe fn rread(id: u64) -> (usize, Vec<u8>) {
	let len = register_len(id) as usize;
	let data = vec![0u8; len];
	read_register(id, data.as_ptr() as u64);
	(len, data)
}

#[allow(dead_code)]
extern "C" {
    pub fn current_account_id(register_id: u64);
    pub fn predecessor_account_id(register_id: u64);
    pub fn input(register_id: u64);
    pub fn panic();
    pub fn log_utf8(len: u64, ptr: u64);
	// promises
    pub fn promise_batch_create(account_id_len: u64, account_id_ptr: u64) -> u64;
    pub fn promise_batch_action_transfer(promise_index: u64, amount_ptr: u64);
	pub fn promise_batch_action_add_key_with_function_call(
		promise_index: u64, 
		public_key_len: u64, 
		public_key_ptr: u64, 
		nonce: u64, 
		allowance_ptr: u64, 
		receiver_id_len: u64, 
		receiver_id_ptr: u64, 
		method_names_len: u64, 
		method_names_ptr: u64
	);
	pub fn promise_batch_action_add_key_with_full_access(
		promise_index: u64, 
		public_key_len: u64, 
		public_key_ptr: u64, 
		nonce: u64
	);
	pub fn promise_batch_action_delete_key(
		promise_index: u64,
		public_key_len: u64,
		public_key_ptr: u64,
	);
    pub fn promise_batch_action_function_call(
        promise_index: u64,
        method_name_len: u64,
        method_name_ptr: u64,
        arguments_len: u64,
        arguments_ptr: u64,
        amount_ptr: u64,
        gas: u64,
    );
	pub fn promise_batch_action_deploy_contract(
		promise_index: u64, 
		code_len: u64, 
		code_ptr: u64
	);
	// crypto
	pub fn ecrecover(
		hash_len: u64,
        hash_ptr: u64,
        sig_len: u64,
        sig_ptr: u64,
        v: u64,
        malleability_flag: u64,
        register_id: u64,
	) -> u64;
	pub fn keccak256(value_len: u64, value_ptr: u64, register_id: u64);
	// io / storage
    pub fn read_register(register_id: u64, ptr: u64);
    pub fn write_register(register_id: u64, data_len: u64, data_ptr: u64);
    pub fn register_len(register_id: u64) -> u64;
	pub fn storage_write(
		key_len: u64, 
		key_ptr: u64, 
		value_len: u64, 
		value_ptr: u64, 
		register_id: u64
	) -> u64;
	pub fn storage_read(
		key_len: u64, 
		key_ptr: u64, 
		register_id: u64
	) -> u64;
	pub fn storage_remove(
		key_len: u64, 
		key_ptr: u64, 
		register_id: u64
	) -> u64;
	// return to client
    pub fn value_return(value_len: u64, value_ptr: u64);
}