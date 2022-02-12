import Mutex from 'idb-mutex';
import { IndexedDBObjectStorage } from '../../shared/storage/IndexedDBObjectStorage';
import { sleep } from '../util';

export default class {
	private storage: IndexedDBObjectStorage<boolean>;

	constructor(private id: string) {
		this.storage = new IndexedDBObjectStorage('mutex', id);
	}

	public async lock(): Promise<void> {
		while (await this.isLocked()) {
			await sleep(5);
		}
		await this.storage.set('mutex-lock-' + this.id, true);
	}

	public async unlock(): Promise<void> {
		await this.storage.set('mutex-lock-' + this.id, false);
	}

	private async isLocked(): Promise<boolean> {
		return (await this.storage.get('mutex-lock-' + this.id)) === true;
	}
}
