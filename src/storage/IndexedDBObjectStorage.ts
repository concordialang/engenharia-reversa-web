import { ClassConstructor, classToPlain, plainToClass } from 'class-transformer';
import { IDBPDatabase, openDB } from 'idb';
import { ObjectStorage } from './ObjectStorage';

export class IndexedDBObjectStorage<Type> implements ObjectStorage<Type> {
	private db: IDBPDatabase | null;
	private readonly dbName: string;
	private readonly storeName: string;
	private typeConstructor?: ClassConstructor<unknown>;

	constructor(dbName: string, storeName: string, typeConstructor?: ClassConstructor<unknown>) {
		this.dbName = dbName;
		this.db = null;
		this.storeName = storeName;
		this.typeConstructor = typeConstructor;
	}

	private async bootstrap(): Promise<boolean> {
		const _this = this;
		return new Promise(async (resolve, reject) => {
			_this.db = await openDB(this.dbName, 1, {
				upgrade(db: IDBPDatabase) {
					if (!db.objectStoreNames.contains(_this.storeName)) {
						db.createObjectStore(_this.storeName);
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
			const json = this.serialize(value);
			await store.put(json, key);
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
			return this.deserialize(result);
		}
		return null;
	}

	protected serialize(obj: Type): {} {
		return classToPlain(obj);
	}

	protected deserialize(json: any): Type {
		if (this.typeConstructor) {
			return <Type>plainToClass(this.typeConstructor, json);
		}
		return json;
	}
}
