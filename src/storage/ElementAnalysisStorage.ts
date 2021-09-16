import { getElementByXpath } from '../util';
import { ElementAnalysis } from '../crawler/ElementAnalysis';
import { LocalObjectStorage } from './LocalObjectStorage';
import { ElementAnalysisStatus } from '../crawler/ElementAnalysisStatus';

// TODO Trocar o nome da classe
export class ElementAnalysisStorage extends LocalObjectStorage<ElementAnalysis> {
	private document: HTMLDocument;

	constructor(localStorage: Storage, document: HTMLDocument) {
		super(localStorage);
		this.document = document;
	}

	protected stringifyObject(obj: ElementAnalysis): string {
		const json: { element: string; pageUrl: string; status: ElementAnalysisStatus } = {
			element: obj.getPathToElement(),
			pageUrl: obj.getPageUrl().toString(),
			status: obj.getStatus(),
		};
		return JSON.stringify(json);
	}

	protected mapJsonToObject(json: {
		element: string;
		pageUrl: string;
		status: ElementAnalysisStatus;
	}): ElementAnalysis {
		let element: HTMLElement | null = getElementByXpath(json.element, this.document);
		if (!element) {
			//TODO GAMBIARRA, REFATORAR DEPOIS
			element = document.body;
		}
		const pageUrl = json.pageUrl;
		return new ElementAnalysis(element, new URL(pageUrl), json.status);
	}

	public async isElementAnalyzed(xPathToElement: string, url: URL): Promise<boolean> {
		const key = url.href + ':' + xPathToElement;
		const analyzed = await this.get(key);
		if (analyzed) return true;
		return false;
	}
}
