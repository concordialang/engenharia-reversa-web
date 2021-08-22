import { DiffDomManager } from '../diff-dom/DiffDomManager';
import { HTMLNodeTypes } from '../html/HTMLNodeTypes';
import { Variant } from '../spec-analyser/Variant';
import { AnalyzedElementStorage } from '../storage/AnalyzedElementStorage';
import { commonAncestorElement, getDiff, getFeatureElements, getPathTo } from '../util';
import { AnalyzedElement } from './AnalyzedElement';
import { BrowserContext } from './BrowserContext';
import { ElementInteraction } from './ElementInteraction';
import { VariantGenerator } from './VariantGenerator';

export class PageAnalyzer {
	constructor(
		private variantGenerator: VariantGenerator,
		private analyzedElementStorage: AnalyzedElementStorage,
		private browserContext: BrowserContext
	) {}

	public async analyze(url: URL, contextElement: HTMLElement): Promise<Variant | null> {
		let xPath = getPathTo(contextElement, this.browserContext.getDocument());
		if (xPath) {
			const analyzedContext = await this.analyzedElementStorage.isElementAnalyzed(xPath, url);

			if (!analyzedContext) {
				// TODO - VERIFICAR E REMOVER
				const variantsOutsideForm = await this.analyseVariantElements(url, contextElement);

				const _this = this;
				const redirectionCallback = async (
					interaction: ElementInteraction<HTMLElement>
				) => {
					const analyzedElement = new AnalyzedElement(
						interaction.getElement(),
						interaction.getPageUrl()
					);
					await _this.analyzedElementStorage.set(
						analyzedElement.getId(),
						analyzedElement
					);
				};

				if (
					contextElement.nodeName !== HTMLNodeTypes.FORM &&
					contextElement.nodeName !== HTMLNodeTypes.TABLE
				) {
					// generate variant for elements outside feature elements
					return await this.variantGenerator.generate(
						contextElement,
						redirectionCallback,
						true
					);
				}
			}
		} else {
			// TODO - tratar excecao para nao travar o programa
			throw new Error('Unable to get element XPath');
		}
		return null;
	}

	private async analyseVariantElements(
		url: URL,
		contextElement: HTMLElement
	): Promise<Variant[]> {
		const variants: Variant[] = [];

		const _this = this;
		const redirectionCallback = async (interaction: ElementInteraction<HTMLElement>) => {
			const analyzedElement = new AnalyzedElement(
				interaction.getElement(),
				interaction.getPageUrl()
			);
			await _this.analyzedElementStorage.set(analyzedElement.getId(), analyzedElement);
		};

		if (
			contextElement.nodeName === HTMLNodeTypes.FORM ||
			contextElement.nodeName === HTMLNodeTypes.TABLE
		) {
			const variant = await this.variantGenerator.generate(
				contextElement,
				redirectionCallback
			);
			if (variant) {
				variants.push(variant);
			}
		}

		const variantTags: any = getFeatureElements(contextElement);
		if (variantTags.length > 0) {
			for (let variantTag of variantTags) {
				let xPathElement = getPathTo(variantTag, this.browserContext.getDocument());
				if (!xPathElement) continue;

				const analyzedElement = await this.analyzedElementStorage.isElementAnalyzed(
					xPathElement,
					url
				);

				if (!analyzedElement) {
					const feature = await this.variantGenerator.generate(
						variantTag,
						redirectionCallback
					);
					if (feature) {
						variants.push(feature);
					}
				}
			}
		}

		return variants;
	}
}
