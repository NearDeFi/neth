use crate::*;

const DOMAIN_HASH: [u8; 34] = [
	25,   1,
	18,  89, 247,  22, 239,  56, 213,  25,
   202, 184, 107,  18, 103,  79, 105, 128,
	 4,  45,  44,  66, 155,  61,  11, 122,
   166, 182, 223, 169,  66, 220, 218, 194
];

const TX_TYPE_HASH: [u8; 32] = [
	86, 246,  96, 247,  82,   9,  62, 114,
   101, 236, 210, 111, 209, 113, 117,  72,
   184, 240, 125, 103,  17, 243, 164, 206,
	45,  16, 238, 120,  22, 254, 210,  73
];

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

/// TODO comment
pub unsafe fn assert_valid_tx(nonce: u64) -> Vec<u8> {
	input(REGISTER_0);
	let (len, data) = rread(REGISTER_0);

	let mut sig_bytes = hex::decode(&data[10..140]).unwrap();
	sig_bytes[64] = sig_bytes[64] - 27;
	let msg_string = from_utf8_unchecked(&data[148..len - 1]).replace("\\\"", "\"");
	let msg = msg_string.as_bytes();
	// log(&msg);

	// create ethereum signed message hash
	let receiver_id = get_string(&msg, RECEIVER_ID);
	let nonce_msg_str = get_string(&msg, NONCE);
	let nonce_msg = get_u128(&msg, NONCE);
	let actions_vec: Vec<&str> = from_utf8_unchecked(&msg).split(ACTIONS).collect();
	let actions = Vec::from(actions_vec[1][0..actions_vec[1].len() - 2].as_bytes());

	// log(&from_utf8_unchecked(&receiver_id));
	// log(&from_utf8_unchecked(&nonce_msg_str));
	// log(&from_utf8_unchecked(&actions));
	
	let mut msg_wrapped = Vec::from(DOMAIN_HASH);
	let mut values = Vec::from(TX_TYPE_HASH);
	values.extend_from_slice(&hash(&receiver_id));
	values.extend_from_slice(&hash(&nonce_msg_str));
	values.extend_from_slice(&hash(&actions));
	msg_wrapped.extend_from_slice(&hash(&values));
	
	let msg_hash = hash(&msg_wrapped);
	
	let result = ecrecover(
		ECRECOVER_MESSAGE_SIZE,
		msg_hash.as_ptr() as u64,
		ECRECOVER_SIGNATURE_LENGTH,
		sig_bytes.as_ptr() as u64,
		sig_bytes[64] as u64,
		ECRECOVER_MALLEABILITY_FLAG,
		REGISTER_1,
	);

	if result == (true as u64) {
		keccak256(u64::MAX, REGISTER_1, REGISTER_2);
		let (_, result_hash_bytes) = rread(REGISTER_2);
		let address_bytes = result_hash_bytes[12..].to_vec();

		// log(&hex::encode(&address_bytes));

		let address_bytes_storage = sread(ADDRESS_KEY);
		if address_bytes != address_bytes_storage {
			panic();
		}

		if nonce != nonce_msg as u64 {
			panic();
		}

		Vec::from(msg)
	} else {
		panic();
		vec![]
	}
}

unsafe fn hash(msg: &[u8]) -> Vec<u8> {
	write_register(REGISTER_1, msg.len() as u64, msg.as_ptr() as u64);
	keccak256(u64::MAX, REGISTER_1, REGISTER_2);
	let (_, hash) = rread(REGISTER_2);
	hash
}