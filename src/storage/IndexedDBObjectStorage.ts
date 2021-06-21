import { IDBPDatabase, openDB } from 'idb';
import { ObjectStorage } from './ObjectStorage';

export abstract class IndexedDBObjectStorage<Type> implements ObjectStorage<Type> {
	private db: IDBPDatabase | null;
	private readonly dbName: string;
	private readonly storeName: string;

	constructor(dbName: string) {
		this.dbName = dbName;
		this.db = null;
		this.storeName = this.getStoreName();
	}

	private async bootstrap(): Promise<boolean> {
		const _this = this;
		return new Promise(async (resolve, reject) => {
			_this.db = await openDB(this.dbName, 1, {
				upgrade(db: IDBPDatabase) {
					if (!db.objectStoreNames.contains(_this.storeName)) {
						db.createObjectStore(_this.storeName);
						resolve(true);
					} else {
						resolve(false);
					}
				},
				blocked() {
					resolve(true);
				},
				blocking() {
					resolve(true);
				},
				terminated() {
					resolve(true);
				},
			});
			resolve(true);
		});
	}

	public async set(key: string, value: Type): Promise<void> {
		if (!this.db) {
			await this.bootstrap();
		}
		const transaction = this.db?.transaction(this.storeName, 'readwrite');
		if (transaction) {
			const store = transaction.objectStore(this.storeName);
			await store.put(value, key);
		}
	}

	public async remove(key: string): Promise<void> {
		if (!this.db) {
			await this.bootstrap();
		}
		const transaction = this.db?.transaction(this.storeName, 'readwrite');
		if (transaction) {
			const store = transaction.objectStore(this.storeName);
			await store.delete(key);
		}
	}

	public async get(key: string): Promise<Type | null> {
		if (!this.db) {
			await this.bootstrap();
		}
		const transaction = this.db?.transaction(this.storeName, 'readonly');
		if (transaction) {
			const store = transaction.objectStore(this.storeName);
			const result = await store.get(key);
			return result;
		}
		return null;
	}

	abstract getStoreName(): string;
}
