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

	public getFeatureTagsFromMutation(mutation) {
		let teste1 = 1;
		let teste2 = mutation.target;
		let teste3 = Array.from(
			mutation.target.querySelectorAll('input, select, textarea, button')
		);
	}
}
