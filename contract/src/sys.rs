use crate::*;

// pub unsafe fn log(message: &str) {
//     log_utf8(message.len() as _, message.as_ptr() as _);
// }

pub unsafe fn return_bytes(bytes: &[u8]) {
    let mut ret_data = vec![DOUBLE_QUOTE_BYTE];
    ret_data.extend_from_slice(bytes);
    ret_data.push(DOUBLE_QUOTE_BYTE);
    near_sys::value_return(ret_data.len() as u64, ret_data.as_ptr() as u64);
}

pub unsafe fn swrite(key: &str, val: &[u8]) {
    near_sys::storage_write(
        key.len() as u64,
        key.as_ptr() as u64,
        val.len() as u64,
        val.as_ptr() as u64,
        REGISTER_0,
    );
}

pub unsafe fn sread(key: &str) -> Vec<u8> {
    near_sys::storage_read(key.len() as u64, key.as_ptr() as u64, REGISTER_0);
    rread(REGISTER_0)
}

pub unsafe fn sread_u64(key: &str) -> u64 {
    let mut word = [0u8; 8];
    word.copy_from_slice(&sread(key));
    u64::from_le_bytes(word)
}

pub unsafe fn rread(id: u64) -> Vec<u8> {
    let len = near_sys::register_len(id) as usize;
    let data = vec![0u8; len];
    near_sys::read_register(id, data.as_ptr() as u64);
    data
}
