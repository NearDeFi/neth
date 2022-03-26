use crate::*;
use alloc::string::String;

// FIXME
pub(crate) fn get_string(string: &str, key: &str) -> Vec<u8> {
    let mut find = String::from(key);
    find.push_str("\":\"");
    let one: Vec<&str> = string.split(&find).collect();
    let two: Vec<&str> = one[1].split('\"').collect();
    two[0].as_bytes().to_vec()
}

pub(crate) fn get_u128(bytes: &str, key: &str) -> u128 {
    let amount_bytes = get_string(bytes, key);
    let len = amount_bytes.len() - 1;
    let mut amount: u128 = 0;
    // TODO this feels wrong
    for (i, byte) in amount_bytes.iter().enumerate() {
        amount += (*byte - 48) as u128 * 10u128.pow((len - i) as u32);
    }
    amount
}

pub(crate) fn get_actions(input: &str) -> Vec<String> {
    let (_, actions) = input
        .split_once(ACTIONS)
        // Assumes input has "actions":" prefix
        .unwrap_or_else(|| unsafe { near_sys::panic() });
    let two: Vec<String> = actions.split("},{").map(|m| m.to_string()).collect();
    two
}
