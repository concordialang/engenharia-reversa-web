export class LocalStorageMock implements Storage {
	private store: {};

	[name: string]: any;

	public length: number;

	constructor() {
		this.store = {};
		this.length = 0;
	}

	public clear(): void {
		this.store = {};
	}

	public getItem(key: string): string {
		return this.store[key];
	}

	public key(index: number): string {
		throw new Error('Method not implemented.');
	}

	public removeItem(key: string): void {
		delete this.store[key];
		this.length--;
	}

	public setItem(key: string, value: string): void {
		if (!this.store[key]) {
			this.length++;
		}
		this.store[key] = String(value);
	}
}
