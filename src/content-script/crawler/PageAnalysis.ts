import { TransformURL } from "../decorators";
import { PageAnalysisStatus } from "./PageAnalysisStatus";

export class PageAnalysis {
	
	@TransformURL()
	private url: URL;

	private status: PageAnalysisStatus;

	constructor(url: URL, status: PageAnalysisStatus) {
		this.url = url;
		this.status = status;
	}


	public getUrl(): URL {
		return this.url;
	}

	public getStatus(): PageAnalysisStatus {
		return this.status;
	}
	
}
