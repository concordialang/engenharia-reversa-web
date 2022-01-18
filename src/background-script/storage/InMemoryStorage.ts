import { ObjectStorage } from '../../shared/storage/ObjectStorage';
import { InMemoryDatabase } from '../extension/InMemoryDatabase';

export class InMemoryStorage<Type> implements ObjectStorage<Type> {
	/*
		Por conta da reflexão do Typescript ser ruim é necessário informar a 
		classe no construtor também 
	*/
	constructor(
		private inMemoryDatabase: InMemoryDatabase
	) {}

	async set(key: string, obj: Type): Promise<void> {
		this.inMemoryDatabase.set(key, obj);
	}

	async get(key: string): Promise<Type | null> {
		return this.inMemoryDatabase.get(key);
	}

	async remove(key: string): Promise<void> {
		this.inMemoryDatabase.remove(key);
	}
}
