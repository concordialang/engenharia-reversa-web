import { getElementByXpath, getPathTo } from '../util';
import { ElementAnalysis } from '../crawler/ElementAnalysis';
import { LocalObjectStorage } from './LocalObjectStorage';
import { ElementAnalysisStatus } from '../crawler/ElementAnalysisStatus';
import { BrowserContext } from '../crawler/BrowserContext';

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

	public async getElementAnalysisStatus(
		xPathToElement: string,
		url: URL
	): Promise<ElementAnalysisStatus> {
		const key = url.href + ':' + xPathToElement;
		const analyzed = await this.get(key);
		if (analyzed) return analyzed.getStatus();
		return ElementAnalysisStatus.Pending;
	}

	public async isInsideElementWithStatus(
		status: ElementAnalysisStatus,
		element: HTMLElement,
		browserContext: BrowserContext
	): Promise<boolean> {
		const parent = element.parentElement;
		let parentXPath: string | null = null;
		if (element.tagName == 'HTML') {
			return false;
		}
		if (parent) {
			parentXPath = getPathTo(parent);
		}
		if (parentXPath) {
			const parentAnalysisStatus = await this.getElementAnalysisStatus(
				parentXPath,
				browserContext.getUrl()
			);
			if (parentAnalysisStatus == status) {
				return true;
			}
			if (parent?.parentElement) {
				return this.isInsideElementWithStatus(status, parent.parentElement, browserContext);
			} else {
				return false;
			}
		} else {
			throw new Error('Unable to get element xPath');
		}
		return false;
	}
}
