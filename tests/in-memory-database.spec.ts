import { InMemoryDatabase } from '../src/background-script/extension/InMemoryDatabase';

describe('InMemoryDatabase', () => {
	it('saves value correctly', () => {
		const database = new InMemoryDatabase();

		const value = {
			id: '123',
			name: 'foo',
		};
		const key = 'key';

		database.set(key, value);

		const retrievedValue = database.get(key);

		expect(retrievedValue).not.toBeNull();
		if (retrievedValue) {
			expect(retrievedValue.id).toBe(value.id);
			expect(retrievedValue.name).toBe(value.name);
		}
	});

	it('removes value correctly', () => {
		const database = new InMemoryDatabase();

		const value = {
			id: '123',
			name: 'foo',
		};
		const key = 'key';

		database.set(key, value);
		database.remove(key);

		const retrievedValue = database.get(key);

		expect(retrievedValue).toBeUndefined();
	});
});
