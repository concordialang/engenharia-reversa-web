export class MutationObserverSentencesGenerator {
	private observer: MutationObserver;

	constructor(feature: HTMLElement) {
		this.observer = new MutationObserver((mutations) => {
			console.log('mutations', mutations);
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

	// private addObserver(feature: HTMLElement){

	// }

	public getMutations() {
		let records = this.observer.takeRecords();
		console.log('records: ', records);
		return records;
	}

	public disconnect() {
		this.observer.disconnect();
	}
}
