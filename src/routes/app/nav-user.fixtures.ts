// Test people for the sidebar user menu, used only in development.

/** Choices shown in the dev data switch in the app. */
export const navUserStates = [
	{ value: 'demo', label: 'Demo data' },
	{ value: 'worst', label: 'Worst case' },
	{ value: 'short', label: 'One-word name' },
	{ value: 'amharic', label: 'Amharic name' }
];

/** Test people for the sidebar user menu, by switch choice. */
export const navUserFixtures: Record<string, { name: string; email: string; roleName: string }> = {
	// A long three-part name, a long Role and a long email.
	worst: {
		name: 'Tsegaye Gebremedhin Woldemichael Haileselassie',
		email: 'bartholomew.fitzgerald@northwind-industries-holdings.example.com',
		roleName: 'Senior Regional Operations Coordinator & Deputy Admin'
	},
	short: { name: 'Jo', email: 'jo@example.et', roleName: 'Intern' },
	// An Amharic name with the "W/ro" (Mrs) title, as member type it.
	amharic: {
		name: 'ወ/ሮ ብርቱካን ገብረመድኅን',
		email: 'birtukan@example.et',
		roleName: 'አባል'
	}
};
