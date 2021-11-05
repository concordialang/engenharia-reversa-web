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
		redirectionCallback?: (interaction: ElementInteraction<HTMLElement>) => Promise<void>
	): Promise<Variant | null> {
		const scenario = feature.getGeneralScenario();

		let variant = this.featureUtil.createVariant(
			feature.getName(),
			scenario.getVariantsCount()
		);

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
		redirectionCallback?: (interaction: ElementInteraction<HTMLElement>) => Promise<void>
	): Promise<void> {
		if (!elm) return;

		const checksChildsRow = await this.treatTableRow(elm, variant, observer);

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
		const interaction = await this.elementInteractionGenerator.generate(elm, variant);
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

		// interacts with the element
		const result = await this.elementInteractionExecutor.execute(
			interaction,
			redirectionCallback,
			true
		);

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

		// save element in feature interaction array
		this.saveInteractedElement(elm, variant.getName(), feature);

		// create variant sentence
		const variantSentence: VariantSentence | null = this.featureUtil.createVariantSentence(
			elm,
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

		variant.setVariantSentence(variantSentence);

		// treat mutational variant sentences
		await this.treatMutationsSentences(observer, variant);

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
		checksChildsRow: boolean
	): Promise<boolean> {
		if (elm.firstElementChild && elm.firstElementChild.nodeName !== HTMLElementType.OPTION) {
			if (elm instanceof HTMLTableRowElement) {
				return checksChildsRow;
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
		observer: MutationObserverManager
	): Promise<boolean> {
		let checksChildsRow = false;

		if (!(elm instanceof HTMLTableRowElement)) {
			return checksChildsRow;
		}

		const row = await this.checkValidRowTable(elm);
		if (row.isValid) {
			if (row.type == 'header') {
				await this.interactWithTableColumn(elm, variant, observer);
			} else if (row.type == 'content') {
				checksChildsRow = true;
				await this.interactWithTableContentRow(elm, variant, observer);
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
		observer: MutationObserverManager
	): Promise<boolean | null> {
		const interaction = await this.elementInteractionGenerator.generate(row, variant);
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
		observer: MutationObserverManager
	) {
		let column: HTMLElement | null = null;

		if (row.childElementCount > 0) {
			column = row.childElementCount >= 2 ? row.cells[1] : row.cells[0];
		}

		if (!column) {
			return null;
		}

		const interaction = await this.elementInteractionGenerator.generate(column, variant);
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
		const scenario = feature.getGeneralScenario();

		if (
			!varUtil.isInteractable(elm) ||
			(scenario.btnVariantsAfterFinalAction && !(elm instanceof HTMLButtonElement))
		) {
			return false;
		}

		let interactableElm = elm as InteractableElement;

		if (
			interactableElm.disabled ||
			interactableElm.hidden ||
			interactableElm.style.display === 'none' ||
			interactableElm.style.visibility === 'hidden'
		) {
			return false;
		}

		if (
			interactableElm instanceof HTMLInputElement ||
			interactableElm instanceof HTMLTextAreaElement
		) {
			if (interactableElm.readOnly) {
				return false;
			}

			if (interactableElm instanceof HTMLInputElement && interactableElm.type === 'hidden') {
				return false;
			}
		}

		return this.checksIfElementCanInteract(interactableElm, variant, feature);
	}

	/*
		Checks whether the element can interact based on previous feature interactions
		Some elements can force creations of new variants and cannot have repeated interactions (button, checkbox, radio)
	*/
	private checksIfElementCanInteract(
		elm: HTMLElement,
		variant: Variant,
		feature: Feature
	): boolean {
		const scenario = feature.getGeneralScenario();

		if (variant.finalActionButtonFound && !scenario.btnVariantsAfterFinalAction) {
			return false;
		}

		if (!varUtil.isButton(elm) && !varUtil.isCheckBox(elm) && !varUtil.isRadionButton(elm)) {
			return true;
		}

		const xpathElement = getPathTo(elm);

		const isFinalActionBtn = this.checksIfIsFinalActionButton(elm);
		if (isFinalActionBtn) {
			variant.finalActionButtonFound = true;
		}

		// checks if the element has already received interaction in the feature
		const alreadyInteracted = feature.InteractedElements.some(
			(interactedElm) => interactedElm.xpath === xpathElement
		);

		if (
			(alreadyInteracted && !isFinalActionBtn) ||
			(isFinalActionBtn && scenario.btnVariantsAfterFinalAction)
		) {
			return false;
		}

		if (varUtil.isRadionButton(elm)) {
			let radio = elm as HTMLInputElement;
			// checks if some group radio button received interaction in this variant
			const anyOfGroupHasInteracted = feature.InteractedElements.some((interactedElm) => {
				return (
					interactedElm.variantName === variant.getName() &&
					interactedElm.radioGroupName == radio.name
				);
			});

			if (anyOfGroupHasInteracted) {
				return false;
			}
		}

		if (varUtil.isButton(elm)) {
			const anyButtonHasInteracted = feature.InteractedElements.some((interactedElm) => {
				return (
					interactedElm.variantName === variant.getName() &&
					interactedElm.elmType === 'button'
				);
			});

			if (anyButtonHasInteracted && !isFinalActionBtn) {
				return false;
			}

			if (!anyButtonHasInteracted && isFinalActionBtn) {
				scenario.btnVariantsAfterFinalAction = true;
			}
		}

		return true;
	}

	// checks whether the element is a final action buttons (buttons that characterize the final action of a variant)
	private checksIfIsFinalActionButton(elm: HTMLElement): boolean {
		if (!varUtil.isButton(elm)) {
			return false;
		}

		let button = elm as HTMLInputElement | HTMLButtonElement;

		let isFinalActionBtn: boolean = false;

		if (button.type === 'submit') {
			isFinalActionBtn = true;
		} else {
			const findFinalActionString = (btnProperty) => {
				isFinalActionBtn = this.dictionary.stringsFinalActionButtons.some((str) => {
					return areSimilar(btnProperty, str);
				});
			};

			if (button.innerText) {
				findFinalActionString(button.innerText);
			}

			if (button.name && !isFinalActionBtn) {
				findFinalActionString(button.name);
			}

			if (button.id && !isFinalActionBtn) {
				findFinalActionString(button.id);
			}

			if (button.value && !isFinalActionBtn) {
				findFinalActionString(button.value);
			}
		}

		return isFinalActionBtn;
	}

	private saveInteractedElement(
		elm: HTMLElement,
		currentVariantName: string,
		feature: Feature
	): void {
		const xpathElement = getPathTo(elm);
		const indexAnalyzedElm = feature.InteractedElements.findIndex(
			(analyzedElms) => analyzedElms.xpath === xpathElement
		);

		if (indexAnalyzedElm !== -1) {
			feature.InteractedElements[indexAnalyzedElm].count++;
			feature.InteractedElements[indexAnalyzedElm].variantName = currentVariantName;
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

			feature.InteractedElements.push(interactedElm);
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
}
