use crate::*;
use alloc::string::String;

const DOMAIN_HASH: [u8; 34] = [
    25, 1, 18, 89, 247, 22, 239, 56, 213, 25, 202, 184, 107, 18, 103, 79, 105, 128, 4, 45, 44, 66,
    155, 61, 11, 122, 166, 182, 223, 169, 66, 220, 218, 194,
];

const TX_TYPE_HASH: [u8; 32] = [
	12, 163, 146, 108, 68, 228, 145, 185,
	80, 103,  50,  49, 34,  90, 111, 250,
	92,  30,  60,  56, 44,  61,  47, 243,
	75, 107,  66, 156, 10,   2,  16, 150
];

pub(crate) fn assert_predecessor() {
    unsafe { near_sys::current_account_id(TEMP_REGISTER) };
    let current_account = register_read(TEMP_REGISTER);

    unsafe { near_sys::predecessor_account_id(TEMP_REGISTER) };
    let predecessor_account = register_read(TEMP_REGISTER);
    if current_account != predecessor_account {
        sys::panic();
    }
}

/// TODO comment
pub(crate) fn assert_valid_tx(nonce: u64) -> String {
    unsafe { near_sys::input(TEMP_REGISTER) };
    let data = register_read(TEMP_REGISTER);

    let mut sig_bytes = hex_decode(&data[10..140]);
    sig_bytes[64] -= 27;
    let msg = expect(alloc::str::from_utf8(&data[148..data.len() - 1]).ok()).replace("\\\"", "\"");
    
    // create ethereum signed message hash
    // let receiver_id = get_string(&msg, RECEIVER_ID);
    let nonce_msg_str = get_string(&msg, NONCE);
    let nonce_msg = get_u128(&msg, NONCE);
    let (_, transactions_vec) = expect(msg.as_str().split_once(TRANSACTIONS));
    let transactions = &transactions_vec.as_bytes()[0..transactions_vec.len() - 2];

    let mut values = Vec::with_capacity(TX_TYPE_HASH.len() + 96);
    values.extend_from_slice(&TX_TYPE_HASH);
    // values.extend_from_slice(&keccak256(receiver_id.as_bytes()));
    values.extend_from_slice(&keccak256(nonce_msg_str.as_bytes()));
    values.extend_from_slice(&keccak256(transactions));

    let mut msg_wrapped = Vec::with_capacity(DOMAIN_HASH.len() + 32);
    msg_wrapped.extend_from_slice(&DOMAIN_HASH);
    msg_wrapped.extend_from_slice(&keccak256(&values));
    let msg_hash = keccak256(&msg_wrapped);

    let result = unsafe {
        near_sys::ecrecover(
            ECRECOVER_MESSAGE_SIZE,
            msg_hash.as_ptr() as u64,
            ECRECOVER_SIGNATURE_LENGTH,
            sig_bytes.as_ptr() as u64,
            sig_bytes[64] as u64,
            ECRECOVER_MALLEABILITY_FLAG,
            REGISTER_1,
        )
    };

    if result == (true as u64) {
        //* SAFETY: REGISTER_1 is filled with ecrecover. Assumes valid ecrecover implementation.
        unsafe { near_sys::keccak256(u64::MAX, REGISTER_1, TEMP_REGISTER) };
        let result_hash_bytes = register_read(TEMP_REGISTER);
        let address_bytes = &result_hash_bytes[12..];

        let address_bytes_storage = storage_read(ADDRESS_KEY);
        if address_bytes != address_bytes_storage {
            sys::panic();
        }

        if nonce != nonce_msg as u64 {
            sys::panic();
        }

        msg
    } else {
        sys::panic()
    }
}
