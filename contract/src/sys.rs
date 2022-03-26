use crate::*;
use core::mem::MaybeUninit;

// pub unsafe fn log(message: &str) {
//     log_utf8(message.len() as _, message.as_ptr() as _);
// }

/// Reads into uninitialized 32 byte buffer. This assumes register is exactly 32 bytes
/// or there will be undefined behaviour.
pub(crate) unsafe fn read_register_fixed_32(register_id: u64) -> [u8; 32] {
    let mut hash = [MaybeUninit::<u8>::uninit(); 32];
    near_sys::read_register(register_id, hash.as_mut_ptr() as _);
    std::mem::transmute(hash)
}

pub(crate) fn read_register_fixed<const N: usize>(register_id: u64) -> [u8; N] {
    let mut buffer = [0; N];
    //* SAFETY: Assumes register length is not greater than the buffer. Less is fine
    //* 		since the buffer is zeroed, but more will cause UB.
    unsafe { near_sys::read_register(register_id, buffer.as_mut_ptr() as _) };
    buffer
}

pub(crate) unsafe fn return_bytes(bytes: &[u8]) {
    let mut ret_data = vec![DOUBLE_QUOTE_BYTE];
    ret_data.extend_from_slice(bytes);
    ret_data.push(DOUBLE_QUOTE_BYTE);
    near_sys::value_return(ret_data.len() as u64, ret_data.as_ptr() as u64);
}

pub(crate) unsafe fn swrite(key: &str, val: &[u8]) {
    near_sys::storage_write(
        key.len() as u64,
        key.as_ptr() as u64,
        val.len() as u64,
        val.as_ptr() as u64,
        REGISTER_0,
    );
}

pub(crate) unsafe fn storage_read(key: &str) -> Vec<u8> {
    near_sys::storage_read(key.len() as u64, key.as_ptr() as u64, REGISTER_0);
    register_read(REGISTER_0)
}

//* SAFETY: Assumes that length of storage value at this key is less than u64 buffer len (8).
pub(crate) unsafe fn sread_u64(key: &str) -> u64 {
    near_sys::storage_read(key.len() as u64, key.as_ptr() as u64, REGISTER_0);
    u64::from_le_bytes(read_register_fixed(REGISTER_0))
}

pub(crate) fn register_read(id: u64) -> Vec<u8> {
    let len = unsafe { near_sys::register_len(id) } as usize;
    let data = vec![0u8; len];

	//* SAFETY: Length of buffer is set dynamically based on `register_len` so it will always
	//* 		be sufficient length.
    unsafe { near_sys::read_register(id, data.as_ptr() as u64) };
    data
}

pub(crate) fn keccak256(value: &[u8]) -> [u8; 32] {
    //* SAFETY: keccak256 syscall will always generate 32 bytes inside of the register
    //*         so the read will have a sufficient buffer of 32, and can transmute from uninit
    //*         because all bytes are filled. This assumes a valid keccak256 implementation.
    unsafe {
        near_sys::keccak256(value.len() as _, value.as_ptr() as _, REGISTER_1);
        read_register_fixed_32(REGISTER_1)
    }
}
