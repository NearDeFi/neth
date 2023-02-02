
// for testing issues related to tx payloads headed to NETH
// success: https://nearblocks.io/txns/4V3JLQb16eR278xcBPJYvVY2thXmYqYjkxbdypQAWpAN#execution
// fail: https://nearblocks.io/txns/vmoasZVARf1PFnKTvaMC7iHd4jbv8CsatMTvZ46qVXq#execution
 

// const DOUBLE_QUOTE_BYTE: u8 = b'\"';
// const ZERO_X: &str = "0x";
// const EXECUTE: &str = "execute";
// const RECEIVER_ID: &str = "|NETH_receiver_id:";
// const PUBLIC_KEY: &str = "|NETH_public_key:";
const AMOUNT: &str = "|NETH_amount:";
// const TYPE: &str = "|NETH_type:";
// const ALLOWANCE: &str = "|NETH_allowance:";
// const METHOD_NAMES: &str = "|NETH_method_names:";
const METHOD_NAME: &str = "|NETH_method_name:";
const ARGS: &str = "|NETH_args:";
const GAS: &str = "|NETH_gas:";
// const CODE: &str = "|NETH_code:";
// const ADDRESS: &str = "address\":\"0x";
// const NONCE: &str = "nonce\":\"";

const ARG_PREFIX: &str = "|NETH_";
const ARG_SUFFIX: &str = "_NETH|";
const RECEIVER_MARKER: &str = "|~-_NETH~-_-~RECEIVER_-~|";
const RECEIVERS: &str = "receivers\":\"";
const TRANSACTIONS: &str = "transactions\":\"";
/// msg syntax adds a header for each transaction and action e.g. NETH00000100 where 00000100 is size of payload
const HEADER_OFFSET: usize = 4;
const HEADER_SIZE: usize = 12;
const PAYLOAD_START: usize = 14;
/// Helper function to panic on None types.
fn expect<T>(v: Option<T>) -> T {
    if cfg!(target_arch = "wasm32") {
        // Allowing because false positive
        #[allow(clippy::redundant_closure)]
        v.unwrap_or_else(|| panic!("expect"))
    } else {
        v.unwrap()
    }
}

/// Helper function to check arg bounds and count on payload
fn check_args_count(args: &str, count: usize) {
	if args.matches(ARG_PREFIX).count() != count || args.matches(ARG_SUFFIX).count() != count {
		panic!("args_count");
	}
}

/// helper to get next value from string key in stringified json
fn get_string<'a>(string: &'a str, key: &str) -> &'a str {
	// had to split twice because .get(value.len() - 1) wasn't working with multiple keys in payload
    let (_, value) = expect(string.split_once(key));
    let (value, _) = expect(value.split_once(ARG_SUFFIX));
    value
}

/// helper to get and parse the next u128 value from a string key in stringified json
fn get_u128(bytes: &str, key: &str) -> u128 {
    let amount_bytes = get_string(bytes, key);
    // TODO: This should be minimal, but can explore removing ToStr usage for code size
    expect(amount_bytes.parse().ok())
}

fn main() {

    let data = "{\"nonce\":\"16\",\"receivers\":\"NETH00100009__wrap.near\",\"transactions\":\"NETH00000185__NETH00000171__|NETH_type:FunctionCall_NETH||NETH_gas:100000000000000_NETH||NETH_method_name:near_withdraw_NETH||NETH_args:{\"amount\":\"616652623894995500000000\"}_NETH||NETH_amount:1_NETH|\"}";
    // let data = "{\"nonce\":\"8\",\"receivers\":\"NETH00300061__contract.main.burrow.near,wrap.near,contract.main.burrow.near\",\"transactions\":\"NETH00000175__NETH00000161__|NETH_type:FunctionCall_NETH||NETH_gas:100000000000000_NETH||NETH_method_name:storage_deposit_NETH||NETH_args:{}_NETH||NETH_amount:250000000000000000000000_NETH|NETH00000368__NETH00000354__|NETH_type:FunctionCall_NETH||NETH_gas:100000000000000_NETH||NETH_method_name:ft_transfer_call_NETH||NETH_args:{\"receiver_id\":\"|~-_NETH~-_-~RECEIVER_-~|\",\"amount\":\"1000000000000000000000000\",\"msg\":\"{\\\"Execute\\\":{\\\"actions\\\":[{\\\"IncreaseCollateral\\\":{\\\"token_id\\\":\\\"wrap.near\\\",\\\"max_amount\\\":\\\"1000000000000000000000000\\\"}}]}}\"}_NETH||NETH_amount:1_NETH|\"}";

    let (_, receivers_data) = expect(data.split_once(RECEIVERS));
    let (mut receivers_data, _) = expect(receivers_data.split_once(TRANSACTIONS));
	receivers_data = &receivers_data[0..receivers_data.len()-3];
	let receivers_len: usize = expect(receivers_data[HEADER_OFFSET+3..HEADER_SIZE].parse().ok());
	let num_receivers: usize = expect(receivers_data[HEADER_OFFSET..HEADER_OFFSET+3].parse().ok());
	receivers_data = &receivers_data[PAYLOAD_START..PAYLOAD_START+receivers_len];
	let mut receivers: Vec<&str> = receivers_data.split(",").collect();
	if num_receivers != receivers.len() || receivers_len != receivers_data.len() {
        panic!("expect");
	}

	let (_, mut transaction_data) = expect(data.split_once(TRANSACTIONS));
	transaction_data = &transaction_data[0..transaction_data.len()-2];

	let mut transaction_data_copy = transaction_data;
	
	let mut num_txs = 0;
	while transaction_data_copy.len() > 0 {
		let transaction_len: usize = expect(transaction_data_copy[HEADER_OFFSET..HEADER_SIZE].parse().ok());
		transaction_data_copy = &transaction_data_copy[PAYLOAD_START+transaction_len..];
		num_txs += 1;
	}
	if num_txs + transaction_data.matches(RECEIVER_MARKER).count() != receivers.len() {
		panic!("num_txs");
	}
	
	// execute transactions
	while transaction_data.len() > 0 {
		// will panic if len 0 (potentially malicious tx injected)
		let receiver_id = receivers.remove(0);
		// execute actions in transaction
		let transaction_len: usize = expect(transaction_data[HEADER_OFFSET..HEADER_SIZE].parse().ok());
		let mut actions_data = &transaction_data[PAYLOAD_START..PAYLOAD_START+transaction_len];
        
        while actions_data.len() > 0 {

			let action_len: usize = expect(actions_data[HEADER_OFFSET..HEADER_SIZE].parse().ok());
			let action = &actions_data[PAYLOAD_START..PAYLOAD_START+action_len];
            
            println!("ACTION LOOP: receiver_id: {:?}, action: {:?}", receiver_id, action);
            
			// action_data read forward
			actions_data = &actions_data[PAYLOAD_START+action_len..];
			
			// type, method_name, amount, gas, args
			check_args_count(action, 5);

			let method_name = get_string(action, METHOD_NAME);
			let amount = get_u128(action, AMOUNT);
			let gas = get_u128(action, GAS) as u64;
			// fill any functionCall args that matched account|receiver and were replaced by RECEIVER_MARKER
			// from the receivers list
			let mut args = get_string(action, ARGS).to_string();
			
			while args.matches(RECEIVER_MARKER).count() > 0 {
				let receiver_id = receivers.remove(0);
				args = args.replacen(RECEIVER_MARKER, receiver_id, 1);
			}
			
            println!("args: {:?}, receiver_id: {:?}, method_name: {:?}, amount: {:?}, gas: {:?}", args, receiver_id, method_name, amount, gas);
        }
		
		// transaction_data read forward
		transaction_data = &transaction_data[PAYLOAD_START+transaction_len..];
    }
	
	
	
}