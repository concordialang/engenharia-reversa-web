import { getPathTo } from '../util';

export class AnalyzedElement {
	private id?: string;
	private pathToElement?: string;

	constructor(private element: HTMLElement, private pageUrl: URL) {
		this.element = element;
		this.pageUrl = pageUrl;
	}

	public getPathToElement(): string {
		if (!this.pathToElement) {
			const pathToElement = getPathTo(this.element);
			if (!pathToElement) {
				throw new Error(
					"Analyzed Element could not be saved because it doesn't have an id and it was not possible to get its xpath"
				);
			}
			this.pathToElement = pathToElement;
			return pathToElement;
		} else {
			return this.pathToElement;
		}
	}

	public getId(): string {
		if (!this.id) {
			const pathToElement = this.getPathToElement();
			const id = this.pageUrl.href + ':' + pathToElement;
			this.id = id;
			return id;
		} else {
			return this.id;
		}
	}

	public getElement(): HTMLElement {
		return this.element;
	}

	public getPageUrl(): URL {
		return this.pageUrl;
	}
}
