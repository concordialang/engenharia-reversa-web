import { HTMLElementType } from '../enums/HTMLElementType';
import { MutationObserverManager } from '../mutation-observer/MutationObserverManager';
import { ElementInteractionExecutor } from '../crawler/ElementInteractionExecutor';
import { ElementInteractionGenerator } from '../crawler/ElementInteractionGenerator';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { Variant } from './Variant';
import { FeatureUtil } from './FeatureUtil';
import { VariantSentence } from './VariantSentence';
import { getPathTo, areSimilar } from '../util';
import { Feature } from './Feature';
import { VariantGeneratorUtil } from './VariantGeneratorUtil';
import { HTMLEventType } from '../enums/HTMLEventType';

type InteractableElement =
	| HTMLInputElement
	| HTMLSelectElement
	| HTMLTextAreaElement
	| HTMLButtonElement;
const varUtil = new VariantGeneratorUtil();

export class VariantGenerator {
	constructor(
		private elementInteractionGenerator: ElementInteractionGenerator,
		private elementInteractionExecutor: ElementInteractionExecutor,
		private featureUtil: FeatureUtil,
		private dictionary
	) {}

	public async generate(
		analysisElement: HTMLElement,
		url: URL,
		observer: MutationObserverManager,
		feature: Feature,
		redirectionCallback?: (
			interactionThatTriggeredRedirect: ElementInteraction<HTMLElement>,
			newVariant: Variant
		) => Promise<void>
	): Promise<Variant | null> {
		let variant = this.featureUtil.createVariant(feature.getName(), feature.getVariantsCount());

		let firstAnalyzeSentence = true;

		let startElement: HTMLElement | null = this.getStartElementToAnalyse(
			analysisElement,
			feature.ignoreFormElements
		);
		// let startElement: HTMLElement = analysisElement.firstElementChild as HTMLElement;
		if (!startElement) {
			return null;
		}

		const givenTypeSentence = this.featureUtil.createGivenTypeVariantSentence(url);
		if (givenTypeSentence) {
			variant.setVariantSentence(givenTypeSentence);
		}

		await this.analyze(
			startElement,
			variant,
			feature,
			observer,
			firstAnalyzeSentence,
			redirectionCallback
		);

		const thenTypeSentence = this.featureUtil.createThenTypeVariantSentence(feature.getName());
		if (thenTypeSentence) {
			variant.setVariantSentence(thenTypeSentence);
		}

		return variant;
	}

	private async analyze(
		elm: HTMLElement | null,
		variant: Variant,
		feature: Feature,
		observer: MutationObserverManager,
		firstAnalyzeSentence: boolean = true,
		redirectionCallback?: (
			interactionThatTriggeredRedirect: ElementInteraction<HTMLElement>,
			newVariant: Variant
		) => Promise<void>
	): Promise<void> {
		if (!elm) return;

		const checksChildsRow = await this.treatTableRow(elm, variant, feature, observer);

		// enters the children of the nodes tree
		const validFirstChild = await this.checksValidFirstChild(
			elm,
			feature.ignoreFormElements,
			checksChildsRow
		);
		if (validFirstChild) {
			await this.analyze(
				<HTMLElement>elm.firstElementChild,
				variant,
				feature,
				observer,
				firstAnalyzeSentence,
				redirectionCallback
			);
		}

		// check if element will receive interaction
		const validInteractableElm = this.checkValidInteractableElement(elm, variant, feature);
		if (!validInteractableElm) {
			if (elm.nextElementSibling) {
				await this.analyze(
					<HTMLElement>elm.nextElementSibling,
					variant,
					feature,
					observer,
					firstAnalyzeSentence,
					redirectionCallback
				);
			}
			return;
		}

		// create interaction for the element
		const interaction = await this.generateInteraction(elm, variant, feature);
		if (!interaction) {
			if (elm.nextElementSibling) {
				await this.analyze(
					<HTMLElement>elm.nextElementSibling,
					variant,
					feature,
					observer,
					firstAnalyzeSentence,
					redirectionCallback
				);
			}
			return;
		}

		const _this = this;

		const callback = async (
			interactionThatTriggeredRedirect: ElementInteraction<HTMLElement>
		) => {
			await _this.createVariantSentence(
				elm,
				variant,
				feature,
				observer,
				firstAnalyzeSentence
			);
			if (redirectionCallback) {
				await redirectionCallback(interactionThatTriggeredRedirect, variant);
			}
		};

		// interacts with the element
		const result = await this.elementInteractionExecutor.execute(interaction, callback, true);

		if (!result) {
			if (elm.nextElementSibling) {
				await this.analyze(
					<HTMLElement>elm.nextElementSibling,
					variant,
					feature,
					observer,
					firstAnalyzeSentence,
					redirectionCallback
				);
			}
			return;
		}

		const variantSentence = this.createVariantSentence(
			elm,
			variant,
			feature,
			observer,
			firstAnalyzeSentence
		);

		if (!variantSentence) {
			if (elm.nextElementSibling) {
				await this.analyze(
					<HTMLElement>elm.nextElementSibling,
					variant,
					feature,
					observer,
					firstAnalyzeSentence,
					redirectionCallback
				);
			}
			return;
		}

		if (firstAnalyzeSentence) {
			firstAnalyzeSentence = false;
		}

		if (elm.nextElementSibling) {
			await this.analyze(
				<HTMLElement>elm.nextElementSibling,
				variant,
				feature,
				observer,
				firstAnalyzeSentence,
				redirectionCallback
			);
		}
	}

	private async generateInteraction(
		element: HTMLElement,
		variant: Variant,
		feature: Feature
	): Promise<ElementInteraction<HTMLElement> | null> {
		const interaction = await this.elementInteractionGenerator.generate(element);
		if (!interaction) {
			return null;
		}
		interaction.setVariant(variant);
		interaction.setFeature(feature);
		return interaction;
	}

	private async createVariantSentence(
		elm: HTMLElement,
		variant: Variant,
		feature: Feature,
		observer: MutationObserverManager,
		firstAnalyzeSentence: boolean
	): Promise<VariantSentence | null> {
		// save element in feature interaction array
		this.saveInteractedElement(elm, variant.getName(), feature);

		// create variant sentence
		const variantSentence: VariantSentence | null = this.featureUtil.createVariantSentence(
			elm,
			firstAnalyzeSentence
		);

		if (!variantSentence) {
			return null;
		}

		variant.setVariantSentence(variantSentence);

		// treat mutational variant sentences
		await this.treatMutationsSentences(observer, variant);

		return variantSentence;
	}

	private getStartElementToAnalyse(
		analysisElement: HTMLElement,
		ignoreFormElements: boolean
	): HTMLElement | null {
		let startElement: HTMLElement | null = null;

		if (!ignoreFormElements) {
			startElement = analysisElement.firstElementChild as HTMLElement;
		} else {
			let firstNoFormElement = Array.from(analysisElement.children).find((elm) => {
				return elm.nodeName !== HTMLElementType.FORM;
			});

			if (firstNoFormElement) {
				startElement = firstNoFormElement as HTMLElement;
			}
		}

		return startElement;
	}

	private async checksValidFirstChild(
		elm: HTMLElement,
		ignoreFormElements: boolean,
		checksChildsTableRow: boolean
	): Promise<boolean> {
		if (elm.firstElementChild && elm.firstElementChild.nodeName !== HTMLElementType.OPTION) {
			if (elm instanceof HTMLTableRowElement) {
				return checksChildsTableRow;
			}

			if (!ignoreFormElements || elm.nodeName !== HTMLElementType.FORM) {
				return true;
			}
		}

		return false;
	}

	private async treatTableRow(
		elm: HTMLElement,
		variant: Variant,
		feature: Feature,
		observer: MutationObserverManager
	): Promise<boolean> {
		let checksChildsRow = false;

		if (!(elm instanceof HTMLTableRowElement)) {
			return checksChildsRow;
		}

		const row = await this.checkValidRowTable(elm);
		if (row.isValid) {
			if (row.type == 'header') {
				await this.interactWithTableColumn(elm, variant, feature, observer);
			} else if (row.type == 'content') {
				checksChildsRow = true;
				await this.interactWithTableContentRow(elm, variant, feature, observer);
			}
		}

		return checksChildsRow;
	}

	// check if element is the first content row or the first header row of the table
	private async checkValidRowTable(elm: HTMLElement) {
		const xpathRowElement = getPathTo(elm);

		let row = {
			isValid: false,
			type: '',
		};

		if (elm.offsetParent && elm.offsetParent instanceof HTMLTableElement) {
			const xpathTableFirstRowHeader = getPathTo(
				elm.offsetParent.getElementsByTagName('th')[0].parentElement as HTMLElement
			);

			const xpathTableFirstRowContent = getPathTo(
				elm.offsetParent.getElementsByTagName('td')[0].parentElement as HTMLElement
			);

			if (xpathRowElement == xpathTableFirstRowHeader) {
				row.isValid = true;
				row.type = 'header';
			}

			if (xpathRowElement == xpathTableFirstRowContent) {
				row.isValid = true;
				row.type = 'content';
			}
		}

		return row;
	}

	// interacts and get mutation sentences (if exists) of the first content table row
	private async interactWithTableContentRow(
		row,
		variant: Variant,
		feature: Feature,
		observer: MutationObserverManager
	): Promise<boolean | null> {
		const interaction = await this.generateInteraction(row, variant, feature);
		if (!interaction) {
			return null;
		}

		const result = await this.elementInteractionExecutor.execute(interaction, undefined, false);
		if (!result) {
			return null;
		}

		const variantSentence: VariantSentence | null = this.featureUtil.createVariantSentence(row);
		if (!variantSentence) {
			return null;
		}

		variant.setVariantSentence(variantSentence);

		await this.treatMutationsSentences(observer, variant);

		return true;
	}

	// interacts and get mutation sentences (if exists) of the second column of table
	private async interactWithTableColumn(
		row,
		variant: Variant,
		feature: Feature,
		observer: MutationObserverManager
	) {
		let column: HTMLElement | null = null;

		if (row.childElementCount > 0) {
			column = row.childElementCount >= 2 ? row.cells[1] : row.cells[0];
		}

		if (!column) {
			return null;
		}

		const interaction = await this.generateInteraction(column, variant, feature);
		if (!interaction) {
			return null;
		}

		const result = await this.elementInteractionExecutor.execute(interaction, undefined, false);
		if (!result) {
			return null;
		}

		const variantSentence: VariantSentence | null = this.featureUtil.createVariantSentence(row);
		if (!variantSentence) {
			return null;
		}

		variant.setVariantSentence(variantSentence);

		await this.treatMutationsSentences(observer, variant);

		return true;
	}

	// check if the element is ready to receive interaction
	private checkValidInteractableElement(elm: HTMLElement, variant: Variant, feature: Feature) {
		if (!varUtil.isInteractable(elm)) {
			return false;
		}

		if (feature.analysesOnlyCancelBtns && !(elm instanceof HTMLButtonElement)) {
			return false;
		}

		if (!varUtil.inEnabled(elm as InteractableElement)) {
			return false;
		}

		if (!varUtil.isButton(elm) && !varUtil.isCheckBox(elm) && !varUtil.isRadionButton(elm)) {
			return true;
		}

		return this.canInteract(elm, variant, feature);
	}

	/*
		Checks whether the element can interact based on previous feature interactions
		Some elements can force creations of new variants and cannot have repeated interactions (button, checkbox, radio)
	*/
	private canInteract(elm: HTMLElement, variant: Variant, feature: Feature): boolean {
		const xpathElement = getPathTo(elm);

		// checks if the element has already received interaction in the feature
		const wasInteracted = feature.interactedElements.some(
			(interactedElm) => interactedElm.xpath === xpathElement
		);

		let isCancelBtn = false;

		if (
			!wasInteracted &&
			varUtil.isButton(elm) &&
			(variant.finalActionButtonFound || feature.analysesOnlyCancelBtns)
		) {
			isCancelBtn = varUtil.isCancelButton(elm, this.dictionary);

			this.saveBtnAfterFinalActionButton(feature, xpathElement, isCancelBtn);
		}

		if (feature.analysesOnlyCancelBtns && !isCancelBtn) {
			return false;
		}

		if (!feature.analysesOnlyCancelBtns && isCancelBtn) {
			return false;
		}

		if (variant.finalActionButtonFound && !feature.analysesBtnsAfterFinalActionBtn) {
			return false;
		}

		const isFinalActionBtn = varUtil.isFinalActionButton(elm, this.dictionary);
		if (isFinalActionBtn) {
			variant.finalActionButtonFound = true;
		}

		if (wasInteracted && !isFinalActionBtn) {
			return false;
		}

		if (isFinalActionBtn && feature.analysesBtnsAfterFinalActionBtn) {
			return false;
		}

		if (varUtil.isRadionButton(elm)) {
			const anyOfGroupHasInteracted = varUtil.anyOfRadioofGroupHasInteracted(
				feature,
				variant.getName(),
				elm as HTMLInputElement
			);
			if (anyOfGroupHasInteracted) {
				return false;
			}
		}

		if (varUtil.isButton(elm)) {
			const anyButtonHasInteracted = varUtil.anyButtonHasInteracted(
				feature,
				variant.getName()
			);

			if (anyButtonHasInteracted && !isFinalActionBtn) {
				return false;
			}
		}

		return true;
	}

	private saveInteractedElement(
		elm: HTMLElement,
		currentVariantName: string,
		feature: Feature
	): void {
		const xpathElement = getPathTo(elm);
		const indexAnalyzedElm = feature.interactedElements.findIndex(
			(analyzedElms) => analyzedElms.xpath === xpathElement
		);

		if (indexAnalyzedElm !== -1) {
			feature.interactedElements[indexAnalyzedElm].count++;
			feature.interactedElements[indexAnalyzedElm].variantName = currentVariantName;
		} else {
			let interactedElm: any = {
				xpath: xpathElement,
				count: 1,
				variantName: currentVariantName,
				elmType: elm.nodeName.toLowerCase(),
			};

			if (varUtil.isRadionButton(elm) && (elm as HTMLInputElement).name) {
				interactedElm.radioGroupName = (elm as HTMLInputElement).name;
				interactedElm.elmType = 'radio';
			} else if (varUtil.isButton(interactedElm)) {
				interactedElm.elmType = 'button';
			}

			feature.interactedElements.push(interactedElm);
		}
	}

	private async treatMutationsSentences(observer: MutationObserverManager, variant: Variant) {
		let mutations: MutationRecord[] = observer.getMutations();

		if (mutations.length == 0) {
			mutations = observer.getRecords();
		}

		if (mutations.length > 0) {
			for (let mutation of mutations) {
				const mutationSentence = this.featureUtil.createMutationVariantSentences(mutation);

				if (mutationSentence) {
					variant.setVariantsSentences(mutationSentence);
				}
			}
		}

		observer.resetMutations();
	}

	private saveBtnAfterFinalActionButton(
		feature: Feature,
		xpathElement: string,
		isCancelButton: boolean
	): void {
		const wasSaved = feature.btnsAfterFinalActionBtn.find((btn) => btn.xpath === xpathElement);

		if (!wasSaved) {
			const btnAfter = {
				xpath: xpathElement,
				isCancelButton: isCancelButton,
			};

			feature.btnsAfterFinalActionBtn.push(btnAfter);
		}
	}
}
