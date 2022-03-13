use near_sdk::{
	env, near_bindgen, PanicOnDefault, BorshStorageKey, AccountId, Promise,
	collections::{LookupMap},
	borsh::{self, BorshDeserialize, BorshSerialize},
};

#[derive(BorshSerialize, BorshStorageKey)]
enum StorageKey {
    NearEth,
	EthNear,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
	near_eth: LookupMap<AccountId, String>,
	eth_near: LookupMap<String, AccountId>,
}

#[near_bindgen]
impl Contract {
	#[init]
	pub fn new() -> Self {
		Self {
			near_eth: LookupMap::new(StorageKey::NearEth),
			eth_near: LookupMap::new(StorageKey::EthNear),
		}
	}

	#[payable]
	pub fn set(&mut self, eth_address: String) {
		// for cost and refund
		let byte_cost = env::storage_byte_cost();
		let storage_before = env::storage_usage() as u128;

		// store
		let account_id = env::predecessor_account_id();
		if self.near_eth.insert(&account_id, &eth_address).is_some() {
			env::panic_str("near_eth account already exists");
		}
		if self.eth_near.insert(&eth_address, &account_id).is_some() {
			env::panic_str("eth_near account already exists");
		}

		// cost and refund
		let deposit = env::attached_deposit();
		let storage_after = env::storage_usage() as u128;
		let cost = (storage_after - storage_before) * byte_cost;
		if deposit < cost {
			env::panic_str(&format!("attach at least {}", cost));
		}
		let diff = deposit.checked_sub(cost).unwrap_or(0);
		if diff > 0 {
			Promise::new(account_id).transfer(diff);
		}
	}

	pub fn get_eth(&self, account_id: AccountId) -> Option<String> {
		self.near_eth.get(&account_id)
	}

	pub fn get_near(&self, eth_address: String) -> Option<AccountId> {
		self.eth_near.get(&eth_address)
	}
}
    
	