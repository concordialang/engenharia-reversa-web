import { PageAnalysis } from "../../content-script/crawler/PageAnalysis";
import { PageAnalysisStatus } from "../../content-script/crawler/PageAnalysisStatus";
import { getURLasString } from "../../content-script/util";
import { InMemoryStorage } from "./InMemoryStorage";
import { InMemoryDatabase } from "../extension/InMemoryDatabase"
import { Config } from "../../shared/config";

export class PageAnalysisStorage extends InMemoryStorage<PageAnalysis> {

	private config: Config;

	constructor(inMemoryDatabase : InMemoryDatabase, config: Config) {
		super(inMemoryDatabase);
		this.config = config;
	}

	public async set(key: string, obj: PageAnalysis): Promise<void> {
		await super.set(key+':page-analysis', obj);
	}

	public async get(key: string): Promise<PageAnalysis|null> {
		return super.get(key+':page-analysis');
	}

	public async getPageAnalysisStatus(
		url: URL
	): Promise<PageAnalysisStatus> {
		const analysis = await this.get(getURLasString(url, this.config));
		if(analysis instanceof PageAnalysis) {
			return analysis.getStatus();
		}
		return PageAnalysisStatus.Pending;
	}
}
