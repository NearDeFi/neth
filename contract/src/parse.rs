use crate::*;

/// helper to get next value from string key in stringified json
pub(crate) fn get_string<'a>(string: &'a str, key: &str) -> &'a str {
	// had to split twice because .get(value.len() - 1) wasn't working with multiple keys in payload
    let (_, value) = expect(string.split_once(key));
    let (value, _) = expect(value.split_once("\""));
    value
}

/// helper to get and parse the next u128 value from a string key in stringified json
pub(crate) fn get_u128(bytes: &str, key: &str) -> u128 {
    let amount_bytes = get_string(bytes, key);
    // TODO: This should be minimal, but can explore removing ToStr usage for code size
    expect(amount_bytes.parse().ok())
}