use crate::*;

pub fn assert_predecessor() {
    unsafe {
        current_account_id(REGISTER_0);
        let (_, current_account) = rread(REGISTER_0);
        predecessor_account_id(REGISTER_1);
        let (_, predecessor_account) = rread(REGISTER_1);
        if current_account != predecessor_account {
            panic();
        }
    }
}

/// Checks that sig of keccak("\x19Ethereum Signed Message:\n32", keccak(msg)) matches ethereum pubkey and returns msg bytes
pub unsafe fn assert_valid_tx(nonce: u64) -> Vec<u8> {
	input(REGISTER_0);
	let (len, data) = rread(REGISTER_0);

	let mut sig_bytes = hex::decode(&data[10..140]).unwrap();
	sig_bytes[64] = sig_bytes[64] - 27;
	let msg = &data[148..len - 1];
	// log(&msg);

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
	
	let result = ecrecover(
		ECRECOVER_MESSAGE_SIZE,
		keccak_hash_2.as_ptr() as u64,
		ECRECOVER_SIGNATURE_LENGTH,
		sig_bytes.as_ptr() as u64,
		sig_bytes[64] as u64,
		ECRECOVER_MALLEABILITY_FLAG,
		REGISTER_1,
	);

	if result == (true as u64) {
		keccak256(u64::MAX, REGISTER_1, REGISTER_2);
		let (_, keccak_hash_bytes) = rread(REGISTER_2);
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