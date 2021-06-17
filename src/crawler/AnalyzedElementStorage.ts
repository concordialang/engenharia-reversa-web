import { AnalyzedElement } from './AnalyzedElement';

export class AnalyzedElementStorage {
	private document: HTMLDocument;

	constructor(document: HTMLDocument) {
		this.document = document;
	}

	public save(analyzedElement: AnalyzedElement): string {
		//console.log(analyzedElement.getElement());
		const pathToElement = this.getPathTo(analyzedElement.getElement());
		//console.log(pathToElement);
		//console.log("-----");
		const pageUrl = analyzedElement.getPageUrl();
		if (pathToElement) {
			const key = analyzedElement.getPageUrl().href + ':' + pathToElement;
			if (!this.get(key)) {
				const json: { element: string; pageUrl: string } = {
					element: pathToElement,
					pageUrl: pageUrl.toString(),
				};
				//console.log("asdas: "+key);
				window.localStorage.setItem(key, JSON.stringify(json));
			}
			return key;
		} else {
			throw new Error(
				"Analyzed Element could not be saved because it doesn't have an id and it was not possible to get its xpath"
			);
		}
	}

	public get(key: string): AnalyzedElement | null {
		const item: string | null = window.localStorage.getItem(key);
		if (item && item.length !== 0 && item.trim()) {
			const json: { element: string; pageUrl: string } = JSON.parse(item);
			const analyzedElement = this.createAnalyzedElement(json, key);
			return analyzedElement;
		}
		return null;
	}

	public isElementAnalyzed(xPathToElement: string, url: URL): boolean {
		const key = url.href + ':' + xPathToElement;
		if (this.get(key)) return true;
		return false;
	}

	public remove(key: string): void {
		window.localStorage.removeItem(key);
	}

	//criar interface serializable e colocar esses métodos nas classes respectivas

	private createAnalyzedElement(
		json: { element: string; pageUrl: string },
		key: string
	): AnalyzedElement | null {
		let element: HTMLElement | null = this.getElementByXpath(json.element, this.document);
		if (!element) {
			//GAMBIARRA, REFATORAR DEPOIS
			element = document.body;
		}
		const pageUrl = json.pageUrl;
		if (element) {
			return new AnalyzedElement(element, new URL(pageUrl));
		}
		return null;
	} // source https://stackoverflow.com/a/2631931/14729456

	/* REFATORAR, colocar em util ou helper */ private getPathTo(
		element: HTMLElement
	): string | null {
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

	/* REFATORAR, colocar em util ou helper */

	private getElementByXpath(path: string, document: HTMLDocument): HTMLElement | null {
		const node = document.evaluate(
			path,
			document,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;
		if (node) {
			return <HTMLElement>node;
		}
		return null;
	}

	private getEnumKeyByEnumValue(myEnum, enumValue) {
		let keys = Object.keys(myEnum).filter((x) => myEnum[x] == enumValue);
		return keys.length > 0 ? myEnum[keys[0]] : null;
	}
}
