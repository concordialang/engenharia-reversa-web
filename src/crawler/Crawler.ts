import { DiffDomManager } from '../analysis/DiffDomManager';
import { Graph } from '../graph/Graph';
import { GraphStorage } from '../storage/GraphStorage';
import { HTMLEventType } from '../html/HTMLEventType';
import Mutex from '../mutex/Mutex';
import { commonAncestorElement } from '../util';
import { AnalyzedElementStorage } from '../storage/AnalyzedElementStorage';
import { BrowserContext } from './BrowserContext';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionGraph } from './ElementInteractionGraph';
import { ElementInteractionStorage } from '../storage/ElementInteractionStorage';
import { FeatureGenerator } from './FeatureGenerator';
import { PageStorage } from '../storage/PageStorage';
import { VisitedURLGraph } from './VisitedURLGraph';

// TODO: Refatorar, principalmente construtor
export class Crawler {
	constructor(
		private browserContext: BrowserContext,
		private featureGenerator: FeatureGenerator,
		private interactionStorage: ElementInteractionStorage,
		private lastInteractionKey: string,
		private pageStorage: PageStorage,
		private lastPageKey: string,
		private elementInteractionGraph: ElementInteractionGraph,
		private visitedURLGraph: VisitedURLGraph
	) {
		this.browserContext = browserContext;
		this.featureGenerator = featureGenerator;
		this.interactionStorage = interactionStorage;
		this.lastInteractionKey = lastInteractionKey;
		this.pageStorage = pageStorage;
		this.lastPageKey = lastPageKey;
		this.elementInteractionGraph = elementInteractionGraph;
		this.visitedURLGraph = visitedURLGraph;
	}

	public async crawl() {
		const _this = this;

		this.visitedURLGraph.addVisitedURLToGraph(this.browserContext.getUrl());

		this.browserContext.getWindow().addEventListener(HTMLEventType.BeforeUnload, async (e) => {
			await _this.pageStorage.set(
				_this.lastPageKey,
				_this.browserContext.getWindow().document.body.outerHTML
			);
		});

		//obtem ultima interacao que não está dentro de form já analisado
		const lastUnanalyzed = await this.getLastUnanalyzedInteraction(
			this.elementInteractionGraph
		);

		let analysisContext: HTMLElement;

		const previousDocHTML = await this.pageStorage.get(this.lastPageKey);
		let analysisElement: HTMLElement | null = null;
		if (previousDocHTML) {
			const template = this.browserContext.getDocument().createElement('template');
			template.innerHTML = previousDocHTML.trim();
			const previousDoc = template.content.firstChild as HTMLElement;
			const diffDomManager = new DiffDomManager(
				previousDoc,
				this.browserContext.getDocument().body
			);
			const xPathParentElementDiff = diffDomManager.getParentXPathOfTheOutermostElementDiff();

			const xpathResult =
				xPathParentElementDiff !== null
					? this.browserContext
							.getDocument()
							.evaluate(
								xPathParentElementDiff,
								this.browserContext.getDocument(),
								null,
								XPathResult.FIRST_ORDERED_NODE_TYPE,
								null
							)
					: null;

			analysisContext =
				xpathResult !== null && xpathResult.singleNodeValue !== null
					? (xpathResult.singleNodeValue as HTMLElement)
					: this.browserContext.getDocument().body;

			const featureTags = analysisContext.querySelectorAll('form, table');

			// find element to analyze based on body tags form and table
			if (featureTags.length >= 1) {
				analysisElement = commonAncestorElement(Array.from(featureTags));
			} else if (featureTags.length == 0) {
				const inputFieldTags = analysisContext.querySelectorAll(
					'input, select, textarea, button'
				);
				analysisElement = commonAncestorElement(Array.from(inputFieldTags));
			}
		} else {
			analysisElement = this.browserContext.getDocument().body;
		}

		if (analysisElement !== null) {
			await this.featureGenerator.analyse(analysisElement);
		}

		//se ultima interacao que não está dentro de form já analisado está em outra página, ir para essa página
		if (
			lastUnanalyzed &&
			lastUnanalyzed.getPageUrl().href != this.browserContext.getUrl().href
		) {
			window.location.href = lastUnanalyzed.getPageUrl().href;
		}
	}

	private async getLastUnanalyzedInteraction(
		elementInteractionGraph: ElementInteractionGraph
	): Promise<ElementInteraction<HTMLElement> | null> {
		const currentInteraction = await this.interactionStorage.get(this.lastInteractionKey);
		if (currentInteraction) {
			const path = await elementInteractionGraph.pathToInteraction(
				currentInteraction,
				true,
				null,
				null,
				false
			);
			const lastUnanalyzed = path.pop();
			if (lastUnanalyzed) {
				return lastUnanalyzed;
			}
		}

		return null;
	}
}
