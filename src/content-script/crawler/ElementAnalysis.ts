import { Exclude } from 'class-transformer';
import { Config } from '../../shared/config';
import { TransformHTMLElement, TransformURL } from '../decorators';
import { getPathTo, getURLasString } from '../util';
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

	@Exclude()
	private config: Config;

	constructor(element: HTMLElement, pageUrl: URL, status: ElementAnalysisStatus, tabId: string, config: Config) {
		this.element = element;
		this.pageUrl = pageUrl;
		this.status = status;
		this.tabId = tabId;
		this.config = config;
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
			const id = getURLasString(this.pageUrl, this.config) + ':' + pathToElement;
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

	public setPathToElement(pathToElement: string): void {
		this.pathToElement = pathToElement;
	}
}
