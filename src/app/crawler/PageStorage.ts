import { IDBPDatabase, openDB } from 'idb';

export class PageStorage {
	private db: IDBPDatabase | null;
	private readonly dbName: string;
	private readonly storeName: string;

	constructor(dbName: string) {
		this.dbName = dbName;
		this.db = null;
		this.storeName = 'pages';
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

	public async setPage(key: string, value: string): Promise<boolean> {
		if (!this.db) {
			await this.bootstrap();
		}
		const transaction = this.db?.transaction(this.storeName, 'readwrite');
		if (transaction) {
			const store = transaction.objectStore(this.storeName);
			const result = await store.put(value, key);
			console.log(result);
			if (result) {
				return true;
			}
		}
		return false;
	}

	public async getPage(key: string): Promise<string | null> {
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
}
