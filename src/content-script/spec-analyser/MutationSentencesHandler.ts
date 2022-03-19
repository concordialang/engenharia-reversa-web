import { Feature } from "./Feature";
import { FeatureUtil } from "./FeatureUtil";
import { VariantGeneratorUtil } from "./VariantGeneratorUtil";
import { VariantSentence } from "./VariantSentence";

export class MutationSenteceHandler {
	private mutationObserver: MutationObserver;
	private varUtil?: VariantGeneratorUtil;
	private mutationSentences: VariantSentence[] = [];

	constructor(
		element: HTMLElement, 
		private feature: Feature, 
		private featureUtil: FeatureUtil
	) {
		this.feature = feature

		this.mutationObserver = new MutationObserver((mutations) => {
			this.treatMutationsSentences(mutations, this.feature)
		});

		const config = {
			attributes: true,
			childList: true,
			characterData: true,
			subtree: true,
			attributeOldValue: true,
			characterDataOldValue: true,
		};

		this.mutationObserver.observe(element, config);
	}

	public getObserver() {
		return this.mutationObserver;
	}

	public resetMutationsSentences() {
		this.mutationSentences = [];
	}

	public getRecords() {
		return this.mutationObserver.takeRecords();
	}

	public disconnect() {
		this.mutationObserver.disconnect();
	}

	public setVariantGeneratorUtil(varUtil: VariantGeneratorUtil){
		this.varUtil = varUtil;
	}

	public getMutationSentences(): VariantSentence[]{
		return this.mutationSentences;
	}

	private treatMutationsSentences(mutations: MutationRecord[], feature: Feature) {
		if(!this.varUtil){
			return null;
		}

		if (mutations.length == 0) {
			mutations = this.getRecords();
		}

		if (mutations.length > 0) {
			for (let mutation of mutations) {
				const mutationSentences = this.featureUtil.createMutationVariantSentences(mutation);

				if (mutationSentences && mutationSentences.length > 0) {
					for(let sentence of mutationSentences){
						if(sentence.uiElement){
							feature.addUiElement(sentence.uiElement);
							this.varUtil.nameUiElementIfEmpty(sentence.uiElement, feature);
						}
					}

					this.mutationSentences = this.mutationSentences.concat(mutationSentences);
				}
			}
		}
	}
}
