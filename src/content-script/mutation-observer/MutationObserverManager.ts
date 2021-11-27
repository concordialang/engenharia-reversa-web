export class MutationObserverManager {
	private observer: MutationObserver;
	private mutations: MutationRecord[] = [];

	constructor(element: HTMLElement) {
		this.observer = new MutationObserver((mutations) => {
			this.mutations = mutations;
		});

		let config = {
			attributes: true,
			childList: true,
			characterData: true,
			subtree: true,
			attributeOldValue: true,
			characterDataOldValue: true,
		};

		this.observer.observe(element, config);
	}

	public getObserver() {
		return this.observer;
	}

	public getMutations() {
		return this.mutations;
	}

	public resetMutations() {
		this.mutations = [];
	}

	public getRecords() {
		return this.observer.takeRecords();
	}

	public disconnect() {
		this.observer.disconnect();
	}
}
