use crate::*;

// FIXME
pub(crate) fn get_string<'a>(string: &'a str, key: &str) -> &'a str {
    let (_, value) = expect(string.split_once(key));
    let value = expect(value.get(..value.len() - 1));
    value
}

pub(crate) fn get_u128(bytes: &str, key: &str) -> u128 {
    let amount_bytes = get_string(bytes, key);
    // TODO: This should be minimal, but can explore removing ToStr usage for code size
    expect(amount_bytes.parse().ok())
}

pub(crate) fn get_actions(input: &str) -> Vec<&str> {
    // Assumes input has "actions":" prefix
    let (_, actions) = expect(input.split_once(ACTIONS));
    actions.split("},{").collect()
}
