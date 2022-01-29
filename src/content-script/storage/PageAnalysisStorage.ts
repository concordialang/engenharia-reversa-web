import { CommunicationChannel } from "../../shared/comm/CommunicationChannel";
import { PageAnalysis } from "../crawler/PageAnalysis";
import { PageAnalysisStatus } from "../crawler/PageAnalysisStatus";
import { InMemoryStorage } from "./InMemoryStorage";

export class PageAnalysisStorage extends InMemoryStorage<PageAnalysis> {

	constructor(communicationChannel: CommunicationChannel) {
		super(communicationChannel, PageAnalysis);
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
		const analysis = await this.get(url.href);
		if(analysis instanceof PageAnalysis) {
			return analysis.getStatus();
		}
		return PageAnalysisStatus.Pending;
	}
}
