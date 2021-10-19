import { ElementAnalysis } from '../src/crawler/ElementAnalysis';
import { ElementAnalysisStatus } from '../src/crawler/ElementAnalysisStatus';
import { ElementAnalysisStorage } from '../src/storage/ElementAnalysisStorage';

describe('ElementAnalysisStorage', () => {
	it('saves element analysis correctly', async () => {
		const url = new URL('http://www.website.com');
		const document = getRootHtmlDocument();

		const innerHTML = `<div id="link1-parent"><a id="link1" href="www.google.com"></a></div>`;
		const div = document.createElement('div');
		div.innerHTML = innerHTML;
		const body = document.getElementsByTagName('body')[0];
		body.appendChild(div);

		const storage = new ElementAnalysisStorage(localStorage);

		const element = document.getElementById('link1');

		expect(element).not.toBeNull();

		if (element) {
			const analysis = new ElementAnalysis(element, url, ElementAnalysisStatus.Done);
			storage.set(analysis.getId(), analysis);

			const fetchedAnalysis = await storage.get(analysis.getId());

			expect(fetchedAnalysis).not.toBeNull();

			if (fetchedAnalysis) {
				expect(fetchedAnalysis.getId()).toBe(analysis.getId());
				expect(fetchedAnalysis.getStatus()).toBe(analysis.getStatus());
				expect(fetchedAnalysis.getPathToElement()).toBe(analysis.getPathToElement());
			}
		}
	});

	function getRootHtmlDocument(): HTMLDocument {
		const dom = document.implementation.createHTMLDocument('Fake document');
		return dom;
	}
});
