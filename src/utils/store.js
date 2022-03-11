export const get = (k) => {
	const v = localStorage.getItem(k);
	if (v?.charAt(0) !== '{') {
		return v;
	}
	try {
		return JSON.parse(v);
	} catch (e) {
		console.warn(e);
	}
};
export const set = (k, v) => localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
export const del = (k) => localStorage.removeItem(k);