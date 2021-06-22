export class AnalyzedElement {
	private id?: string;
	private pathToElement?: string;

	constructor(private element: HTMLElement, private pageUrl: URL) {
		this.element = element;
		this.pageUrl = pageUrl;
	}

	public getPathToElement(): string {
		if (!this.pathToElement) {
			const pathToElement = this.getPathTo(this.element);
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

	/* TODO REFATORAR, colocar em util ou helper */

	private getPathTo(element: HTMLElement): string | null {
		if (element.id !== '') return 'id("' + element.id + '")';
		if (element === document.body) return element.tagName;

		var ix = 0;
		const parentNode = element.parentNode;
		if (parentNode) {
			var siblings = parentNode.childNodes;
			for (var i = 0; i < siblings.length; i++) {
				var sibling = <HTMLElement>siblings[i];
				if (sibling === element)
					return (
						this.getPathTo(<HTMLElement>parentNode) +
						'/' +
						element.tagName +
						'[' +
						ix +
						']'
					);
				if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
			}
		}

		return null;
	}
}
