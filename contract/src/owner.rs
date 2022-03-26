use crate::*;

const DOMAIN_HASH: [u8; 34] = [
    25, 1, 18, 89, 247, 22, 239, 56, 213, 25, 202, 184, 107, 18, 103, 79, 105, 128, 4, 45, 44, 66,
    155, 61, 11, 122, 166, 182, 223, 169, 66, 220, 218, 194,
];

const TX_TYPE_HASH: [u8; 32] = [
    86, 246, 96, 247, 82, 9, 62, 114, 101, 236, 210, 111, 209, 113, 117, 72, 184, 240, 125, 103,
    17, 243, 164, 206, 45, 16, 238, 120, 22, 254, 210, 73,
];

pub fn assert_predecessor() {
    unsafe {
        near_sys::current_account_id(REGISTER_0);
        let current_account = register_read(REGISTER_0);
        near_sys::predecessor_account_id(REGISTER_1);
        let predecessor_account = register_read(REGISTER_1);
        if current_account != predecessor_account {
            near_sys::panic();
        }
    }
}

/// TODO comment
pub unsafe fn assert_valid_tx(nonce: u64) -> String {
    near_sys::input(REGISTER_0);
    let data = register_read(REGISTER_0);

    let mut sig_bytes = hex_decode(&data[10..140]);
    sig_bytes[64] -= 27;
    let msg = alloc::str::from_utf8(&data[148..data.len() - 1])
        .unwrap_or_else(|_| near_sys::panic())
        .replace("\\\"", "\"");
    // log(&msg);

    // create ethereum signed message hash
    let receiver_id = get_string(&msg, RECEIVER_ID);
    let nonce_msg_str = get_string(&msg, NONCE);
    let nonce_msg = get_u128(&msg, NONCE);
    let actions_vec: Vec<&str> = msg.as_str().split(ACTIONS).collect();
    let actions = Vec::from(actions_vec[1][0..actions_vec[1].len() - 2].as_bytes());

    let mut msg_wrapped = Vec::from(DOMAIN_HASH);
    let mut values = Vec::from(TX_TYPE_HASH);
    values.extend_from_slice(&keccak256(&receiver_id));
    values.extend_from_slice(&keccak256(&nonce_msg_str));
    values.extend_from_slice(&keccak256(&actions));
    msg_wrapped.extend_from_slice(&keccak256(&values));
    let msg_hash = keccak256(&msg_wrapped);

    let result = near_sys::ecrecover(
        ECRECOVER_MESSAGE_SIZE,
        msg_hash.as_ptr() as u64,
        ECRECOVER_SIGNATURE_LENGTH,
        sig_bytes.as_ptr() as u64,
        sig_bytes[64] as u64,
        ECRECOVER_MALLEABILITY_FLAG,
        REGISTER_1,
    );

    if result == (true as u64) {
        near_sys::keccak256(u64::MAX, REGISTER_1, REGISTER_2);
        let result_hash_bytes = register_read(REGISTER_2);
        let address_bytes = &result_hash_bytes[12..];

        // log(&hex::encode(&address_bytes));

        let address_bytes_storage = storage_read(ADDRESS_KEY);
        if address_bytes != address_bytes_storage {
            near_sys::panic();
        }

        if nonce != nonce_msg as u64 {
            near_sys::panic();
        }

        msg
    } else {
        near_sys::panic()
    }
}
