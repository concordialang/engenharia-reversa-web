export class MutationObserverSentencesGenerator {
	private observer: MutationObserver;
	private mutations: MutationRecord[] = [];

	constructor(feature: HTMLElement) {
		this.observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				console.log('mutation', mutation);
			});
		});

		var config = {
			attributes: true,
			childList: true,
			characterData: true,
			subtree: true,
			attributeOldValue: true,
			characterDataOldValue: true,
		};

		this.observer.observe(feature, config);
	}

	public getMutations() {
		return this.mutations;
	}

	public getRecords() {
		return this.observer.takeRecords();
	}

	public disconnect() {
		this.observer.disconnect();
	}
}
