import { CommunicationChannel } from "../../shared/comm/CommunicationChannel";
import { Config } from "../../shared/config";
import { PageAnalysis } from "../crawler/PageAnalysis";
import { PageAnalysisStatus } from "../crawler/PageAnalysisStatus";
import { getURLasString } from "../util";
import { InMemoryStorage } from "./InMemoryStorage";

export class PageAnalysisStorage extends InMemoryStorage<PageAnalysis> {

	private config: Config;

	constructor(communicationChannel: CommunicationChannel, config: Config) {
		super(communicationChannel, PageAnalysis);
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
