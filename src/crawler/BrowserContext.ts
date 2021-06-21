export class BrowserContext {
	constructor(private document: HTMLDocument, private url: URL, private window: Window) {
		this.document = document;
		this.url = url;
		this.window = window;
	}

	public getDocument(): HTMLDocument {
		return this.document;
	}

	public getUrl(): URL {
		return this.url;
	}

	public getWindow(): Window {
		return this.window;
	}
}
