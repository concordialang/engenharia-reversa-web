export class InMemoryDatabase {
	private map: Map<string, any>;

	constructor() {
		this.map = new Map();
	}

	public set(key: string, value: any) {
		this.map.set(key, value);
	}

	public get(key: string): any | undefined {
		return this.map.get(key);
	}

	public remove(key: string): void {
		this.map.delete(key);
	}
}
