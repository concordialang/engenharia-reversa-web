export class BrowserContext {
	constructor(private url: URL, private window: Window, private tabId: string) {}

	public getUrl(): URL {
		return this.url;
	}

	public getWindow(): Window {
		return this.window;
	}

	public getTabId(): string {
		return this.tabId;
	}
}
