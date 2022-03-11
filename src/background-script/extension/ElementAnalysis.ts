import { Exclude } from "class-transformer";
import { ElementAnalysisStatus } from "../../content-script/crawler/ElementAnalysisStatus";
import { TransformURL } from "../../content-script/decorators";
import { getURLasString } from "../../content-script/util";
import { Config } from "../../shared/config";

export class ElementAnalysis {
	private id?: string;
	private pathToElement: string;

	@TransformURL()
	private pageUrl: URL;

	private status: ElementAnalysisStatus;

	private tabId: string;

	@Exclude()
	private config: Config;

	constructor(pathToElement: string, pageUrl: URL, status: ElementAnalysisStatus, tabId: string, config: Config) {
		this.pathToElement = pathToElement;
		this.pageUrl = pageUrl;
		this.status = status;
		this.tabId = tabId;
		this.config = config;
	}

	public getPathToElement(): string {
		return this.pathToElement;
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
