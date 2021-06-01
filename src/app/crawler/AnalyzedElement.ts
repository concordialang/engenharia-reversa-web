export class AnalyzedElement {
	private element: HTMLElement;
	private pageUrl: URL;

	constructor(element: HTMLElement, pageUrl: URL) {
		this.element = element;
		this.pageUrl = pageUrl;
	}

	public getElement(): HTMLElement {
		return this.element;
	}

	public getPageUrl(): URL {
		return this.pageUrl;
	}
}
