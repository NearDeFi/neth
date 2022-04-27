use crate::*;
use alloc::string::String;

/// compile time constant for the eth typed signed data payloads
/// matches keccak256(`{"name":"NETH","version":"1","chainId":1313161554}`)
const DOMAIN_HASH: [u8; 34] = [
    25, 1, 18, 89, 247, 22, 239, 56, 213, 25, 202, 184, 107, 18, 103, 79, 105, 128, 4, 45, 44, 66,
    155, 61, 11, 122, 166, 182, 223, 169, 66, 220, 218, 194,
];

/// compile time constant for the eth typed signed data payloads
/// matches keccak256("Transaction(string nonce,string transactions)")
const TX_TYPE_HASH: [u8; 32] = [
	12, 163, 146, 108, 68, 228, 145, 185,
	80, 103,  50,  49, 34,  90, 111, 250,
	92,  30,  60,  56, 44,  61,  47, 243,
	75, 107,  66, 156, 10,   2,  16, 150
];

/// checks to ensure call is coming from the NEAR account that this contract is deployed on
pub(crate) fn assert_predecessor() {
    unsafe { near_sys::current_account_id(TEMP_REGISTER) };
    let current_account = register_read(TEMP_REGISTER);

    unsafe { near_sys::predecessor_account_id(TEMP_REGISTER) };
    let predecessor_account = register_read(TEMP_REGISTER);
    if current_account != predecessor_account {
        sys::panic();
    }
}

/// This method is the main validation of the eth typed signed data payload.
/// It checks whether the payload passed in (as stringified JSON) was accurately signed by the ethereum address in storage.
/// 
/// args: { sig: string, msg: string }
/// 
/// First the signature bytes are extracted from the args.
/// Next the msg bytes are extracted including the current nonce (which was signed on the client side).
/// 
/// The ethereum message hash is recreated and wrapped with all the eth typed signed data requirements.
/// 
/// Finally the message hash is checked against the signature using ecrecover pre-compile from NEAR runtime system.
/// 
/// If the result is true (1) we will check the recovered address and the nonce against values in storage and
/// return the msg payload to execute() so the transactions in the payload can be executed.
pub(crate) fn assert_valid_tx(nonce: u64) -> String {
    unsafe { near_sys::input(TEMP_REGISTER) };
    let data = register_read(TEMP_REGISTER);

    let mut sig_bytes = hex_decode(&data[10..140]);
    // known offset for final byte of ethereum signatures, reduces to either 0 or 1 from 27 or 28
    sig_bytes[64] -= 27;
    // json stringify + borsh double escaped quotes in msg payload, strip slashes
    let msg = expect(alloc::str::from_utf8(&data[148..data.len() - 1]).ok()).trim().replace("\\\"", "\"");
    
    let (_, transactions_vec) = expect(msg.as_str().split_once(TRANSACTIONS));
    let transactions = &transactions_vec.as_bytes()[0..transactions_vec.len() - 2];
    let nonce_msg_str = get_string(&msg, NONCE);

    // build the inner msg payload for TX_TYPE: Transaction(string nonce,string transactions)
    let mut values = Vec::with_capacity(TX_TYPE_HASH.len() + 96);
    values.extend_from_slice(&TX_TYPE_HASH);
    values.extend_from_slice(&keccak256(nonce_msg_str.as_bytes()));
    values.extend_from_slice(&keccak256(transactions));

    // build wrapped msg payload for DOMAIN: {"name":"NETH","version":"1","chainId":1313161554}
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

        let nonce_msg = get_u128(&msg, NONCE);
        if nonce != nonce_msg as u64 {
            sys::panic();
        }

        msg
    } else {
        sys::panic()
    }
}
