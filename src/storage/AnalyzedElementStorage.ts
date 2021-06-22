import { getElementByXpath } from '../util';
import { AnalyzedElement } from '../crawler/AnalyzedElement';
import { LocalObjectStorage } from './LocalObjectStorage';

// TO-DO Trocar o nome da classe
export class AnalyzedElementStorage extends LocalObjectStorage<AnalyzedElement> {
	private document: HTMLDocument;

	constructor(localStorage: Storage, document: HTMLDocument) {
		super(localStorage);
		this.document = document;
	}

	protected stringifyObject(obj: AnalyzedElement): string {
		const json: { element: string; pageUrl: string } = {
			element: obj.getPathToElement(),
			pageUrl: obj.getPageUrl().toString(),
		};
		return JSON.stringify(json);
	}

	protected mapJsonToObject(json: { element: string; pageUrl: string }): AnalyzedElement {
		let element: HTMLElement | null = getElementByXpath(json.element, this.document);
		if (!element) {
			//TO-DO GAMBIARRA, REFATORAR DEPOIS
			element = document.body;
		}
		const pageUrl = json.pageUrl;
		return new AnalyzedElement(element, new URL(pageUrl));
	}

	public async isElementAnalyzed(xPathToElement: string, url: URL): Promise<boolean> {
		const key = url.href + ':' + xPathToElement;
		const analyzed = await this.get(key);
		if (analyzed) return true;
		return false;
	}
}
