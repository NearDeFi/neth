use alloc::str::from_utf8_unchecked;
use alloc::vec::Vec;
use alloc::string::String;

// pub fn get_bytes(bytes: &[u8], key: &str) -> Vec<u8> {
// 	Vec::from(get_string(bytes, key).as_bytes())
// }

pub fn get_string(bytes: &[u8], key: &str) -> String {
	unsafe {
		let mut find = String::from(key);
		find.push_str("\":\"");
		let string = from_utf8_unchecked(bytes);
		let one: Vec<&str> = string.split(&find).collect();
		let two: Vec<&str> = one[1].split("\"").collect();
		String::from(two[0])
	}
}