import Mutex from 'idb-mutex';

export default class {
	private mutexVendor: Mutex;

	constructor(id: string) {
		this.mutexVendor = new Mutex(id);
	}

	public lock(): Promise<void> {
		return this.mutexVendor.lock();
	}

	public unlock(): Promise<{}> {
		return this.mutexVendor.unlock();
	}
}
