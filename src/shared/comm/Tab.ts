export class Tab {
	private id: string;
	private url: URL|null;

	constructor(id: string, url: URL|null = null) {
		this.id = id;
		this.url = url;
	}

	public getId(): string {
		return this.id;
	}

	public getURL(): URL|null {
		return this.url;
	}

}
