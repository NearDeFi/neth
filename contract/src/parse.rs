use crate::*;

pub unsafe fn get_string(bytes: &[u8], key: &str) -> Vec<u8> {
	let mut find = key.as_bytes().to_vec();
	find.extend_from_slice("\":\"".as_bytes());
	let string = from_utf8_unchecked(bytes);
	let one: Vec<&str> = string.split(from_utf8_unchecked(find.as_slice())).collect();
	let two: Vec<&str> = one[1].split("\"").collect();
	two[0].as_bytes().to_vec()
}

pub unsafe fn get_u128(bytes: &[u8], key: &str) -> u128 {
	let amount_bytes = get_string(bytes, key);
	let len = amount_bytes.len() - 1;
	let mut amount: u128 = 0;
	for (i, byte) in amount_bytes.iter().enumerate() {
		amount += (*byte - 48) as u128 * 10u128.pow((len - i) as u32);
	}
	amount
}

pub unsafe fn get_actions(bytes: &[u8]) -> Vec<Vec<u8>> {
	let string = from_utf8_unchecked(bytes);
	let one: Vec<&str> = string.split("actions\":[{").collect();
	let two: Vec<&str> = one[1].split("]}").collect();
	let three: Vec<Vec<u8>> = two[0].split("},{").map(|m| {
		m.as_bytes().to_vec()
	}).collect();
	three
}