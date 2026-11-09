// Ids for new records. The screen makes the id before saving, so sending the same create twice
// (a double tap, a retry after a dropped connection) saves one record, not two. Safe to use in the browser.

const hex = (bytes: Uint8Array) =>
	Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

// Ids made in the same millisecond take the next number in the 12 bits after the time,
// so they still sort in the order they were made.
let lastMs = -1;
let sequence = 0;

/** Makes a new record id: a version 7 UUID, which starts with the time so ids sort by creation. */
export function newId(now: Date = new Date()): string {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	let ms = now.getTime();
	if (ms === lastMs) {
		sequence += 1;
		// After 4096 ids in one millisecond, borrow the next millisecond.
		if (sequence > 0xfff) {
			ms = lastMs + 1;
			sequence = 0;
		} else ms = lastMs;
	} else sequence = bytes[7]! & 0x7f; // start low and random, leaving room to count up
	lastMs = ms;
	for (let i = 0; i < 6; i++) bytes[i] = Math.floor(ms / 2 ** (8 * (5 - i))) & 0xff;
	bytes[6] = 0x70 | (sequence >> 8);
	bytes[7] = sequence & 0xff;
	bytes[8] = (bytes[8]! & 0x3f) | 0x80;
	const h = hex(bytes);
	return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Checks whether a string is a record id. */
export function isId(value: string): boolean {
	return idPattern.test(value);
}
