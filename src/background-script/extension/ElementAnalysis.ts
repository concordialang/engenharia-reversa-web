import { ElementAnalysisStatus } from "../../content-script/crawler/ElementAnalysisStatus";
import { TransformURL } from "../../content-script/decorators";

export class ElementAnalysis {
	private id?: string;
	private pathToElement: string;

	@TransformURL()
	private pageUrl: URL;

	private status: ElementAnalysisStatus;

	private tabId: string;

	constructor(pathToElement: string, pageUrl: URL, status: ElementAnalysisStatus, tabId: string) {
		this.pathToElement = pathToElement;
		this.pageUrl = pageUrl;
		this.status = status;
		this.tabId = tabId;
	}

	public getPathToElement(): string {
		return this.pathToElement;
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
