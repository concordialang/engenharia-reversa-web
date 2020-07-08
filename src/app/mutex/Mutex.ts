import Mutex from 'idb-mutex';

class MutexClass {
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

export { MutexClass as Mutex };
