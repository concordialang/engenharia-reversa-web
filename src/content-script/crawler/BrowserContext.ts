export class BrowserContext {
	constructor(private url: URL, private window: Window) {
		this.url = url;
		this.window = window;
	}

	public getUrl(): URL {
		return this.url;
	}

	public getWindow(): Window {
		return this.window;
	}
}
