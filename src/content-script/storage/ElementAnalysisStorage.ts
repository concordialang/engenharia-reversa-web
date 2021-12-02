import { getPathTo } from '../util';
import { ElementAnalysis } from '../crawler/ElementAnalysis';
import { LocalObjectStorage } from './LocalObjectStorage';
import { ElementAnalysisStatus } from '../crawler/ElementAnalysisStatus';
import { BrowserContext } from '../crawler/BrowserContext';

// TODO Trocar o nome da classe
export class ElementAnalysisStorage extends LocalObjectStorage<ElementAnalysis> {
	constructor(localStorage: Storage) {
		super(localStorage, ElementAnalysis);
	}

	public async getWithXpathAndUrl(
		xPathToElement: string,
		url: URL
	): Promise<ElementAnalysis | null> {
		const key = url.href + ':' + xPathToElement;
		return this.get(key);
	}

	public async getElementAnalysisStatus(
		xPathToElement: string,
		url: URL
	): Promise<ElementAnalysisStatus> {
		const analysis = await this.getWithXpathAndUrl(xPathToElement, url);
		if (analysis) return analysis.getStatus();
		return ElementAnalysisStatus.Pending;
	}

	public async isInsideElementWithStatus(
		status: ElementAnalysisStatus | ElementAnalysisStatus[],
		element: HTMLElement,
		browserContext: BrowserContext
	): Promise<boolean> {
		if (!Array.isArray(status)) {
			status = [status];
		}
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
			if (status.includes(parentAnalysisStatus)) {
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
	}
}
