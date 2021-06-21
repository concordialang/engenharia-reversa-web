import { ObjectStorage } from './ObjectStorage';

export abstract class LocalObjectStorage<Type> implements ObjectStorage<Type> {
	constructor(private localStorage: Storage) {
		this.localStorage = localStorage;
	}

	async set(key: string, obj: Type): Promise<void> {
		const stringifiedObject = this.stringifyObject(obj);
		this.localStorage.setItem(key, stringifiedObject);
	}

	async get(key: string): Promise<Type | null> {
		const jsonString = this.localStorage.getItem(key);
		if (jsonString) {
			const json = JSON.parse(jsonString);
			return this.mapJsonToObject(json);
		}
		return null;
	}

	async remove(key: string): Promise<void> {
		this.localStorage.removeItem(key);
	}

	protected abstract stringifyObject(obj: Type): string;

	protected abstract mapJsonToObject(json: {}): Type;
}
