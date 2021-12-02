import { TransformHTMLElement, TransformURL } from '../decorators';
import { getPathTo } from '../util';
import { ElementAnalysisStatus } from './ElementAnalysisStatus';

export class ElementAnalysis {
	private id?: string;
	private pathToElement?: string;

	@TransformHTMLElement()
	private element: HTMLElement;

	@TransformURL()
	private pageUrl: URL;

	private status: ElementAnalysisStatus;

	private tabId: string;

	constructor(element: HTMLElement, pageUrl: URL, status: ElementAnalysisStatus, tabId: string) {
		this.element = element;
		this.pageUrl = pageUrl;
		this.status = status;
		this.tabId = tabId;
	}

	public getPathToElement(): string {
		if (!this.pathToElement) {
			const pathToElement = getPathTo(this.element);
			if (!pathToElement) {
				throw new Error(
					"Element Analysis could not be saved because it doesn't have an id and it was not possible to get its xpath"
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

	public getStatus(): ElementAnalysisStatus {
		return this.status;
	}

	public getTabId(): string {
		return this.tabId;
	}
}
