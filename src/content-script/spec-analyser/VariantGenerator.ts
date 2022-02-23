import { HTMLElementType } from '../enums/HTMLElementType';
import { MutationObserverManager } from '../mutation-observer/MutationObserverManager';
import { ElementInteractionExecutor } from '../crawler/ElementInteractionExecutor';
import { ElementInteractionGenerator } from '../crawler/ElementInteractionGenerator';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { Variant } from './Variant';
import { FeatureUtil } from './FeatureUtil';
import { VariantSentence } from './VariantSentence';
import { getPathTo } from '../util';
import { Feature } from './Feature';
import { VariantGeneratorUtil } from './VariantGeneratorUtil';
import { classToPlain } from 'class-transformer';

export class VariantGenerator {
	constructor(
		private elementInteractionGenerator: ElementInteractionGenerator,
		private elementInteractionExecutor: ElementInteractionExecutor,
		private featureUtil: FeatureUtil,
		private varUtil: VariantGeneratorUtil,
	) {}

	public async generate(
		analysisElement: HTMLElement,
		url: URL,
		observer: MutationObserverManager,
		feature: Feature,
		redirectionCallback?: (
			interactionThatTriggeredRedirect: ElementInteraction<HTMLElement>,
			newVariant: Variant,
			unloadMessageExtra: any
		) => Promise<void>,
		variant: Variant | null = null,
		pathsOfElementsToIgnore: string[] = []
	): Promise<Variant | null> {
		this.varUtil.addAnalysisElement(analysisElement);

		variant =
			variant ??
			this.featureUtil.createVariant(feature.getName(), feature.getVariantsCount());

		let startElement: HTMLElement | null = this.getStartElementToAnalyse(
			analysisElement,
			feature.ignoreFormElements
		);
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
			redirectionCallback,
			pathsOfElementsToIgnore
		);

		const lastButtonInteracted = variant.getLastButtonInteracted();

		const thenTypeSentence = this.featureUtil.createThenTypeVariantSentence(
			feature.getName(),
			lastButtonInteracted
		);
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
		redirectionCallback?: (
			interactionThatTriggeredRedirect: ElementInteraction<HTMLElement>,
			newVariant: Variant,
			unloadMessageExtra: any
		) => Promise<void>,
		pathsOfElementsToIgnore: string[] = []
	): Promise<void> {
		if (!elm) return;

		//console.log(elm.id);
		const nextElement = async (nextElmToBeAnalyzed) => {
			return this.analyze(
				nextElmToBeAnalyzed as HTMLElement,
				variant,
				feature,
				observer,
				redirectionCallback,
				pathsOfElementsToIgnore
			);
		};

		const path = getPathTo(elm);

		if (pathsOfElementsToIgnore.includes(getPathTo(elm))) {
			if (elm.nextElementSibling) {
				await nextElement(elm.nextElementSibling);
			}
			return;
		}
		const checksChildsTableRow = await this.treatTableRow(elm, variant, feature, observer);

		// enters the children of the nodes tree
		const validFirstChild = await this.checksValidFirstChild(
			elm,
			feature.ignoreFormElements,
			checksChildsTableRow
		);
		if (validFirstChild && !this.varUtil.isButtonOrAnchor(elm)) {
			await nextElement(elm.firstElementChild);
		}

		// check if element will receive interaction
		const validInteractableElm = this.checkValidInteractableElement(elm, variant, feature);
		console.log("interagivel: ", validInteractableElm);
		if(
			path == "/html/body/table/tbody/tr/td[1]/div/div[1]/div[2]/a" && 
			window.location.href.includes("product/index.php") &&
			validInteractableElm
		){
			console.error("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
		}
		console.log("path", path);
		console.log("text:", elm.innerText);
		if (!validInteractableElm) {
			variant.lastAnalysisInputFieldFound = this.varUtil.isLastFieldAnalyzed(
				elm,
				variant.lastAnalysisInputFieldFound
			);

			if (elm.nextElementSibling) {
				await nextElement(elm.nextElementSibling);
			}
			return;
		}


		// create interaction for the element
		const interaction = await this.generateInteraction(elm, variant, feature);
		if (!interaction) {
			variant.lastAnalysisInputFieldFound = this.varUtil.isLastFieldAnalyzed(
				elm,
				variant.lastAnalysisInputFieldFound
			);

			if (elm.nextElementSibling) {
				await nextElement(elm.nextElementSibling);
			}
			return;
		}

		const callback = await this.generatesCallBack(
			variant,
			feature,
			observer,
			redirectionCallback
		);

		// interacts with the element
		console.log(interaction);
		const result = await this.elementInteractionExecutor.execute(interaction, callback, true);
		if (!result) {
			variant.lastAnalysisInputFieldFound = this.varUtil.isLastFieldAnalyzed(
				elm,
				variant.lastAnalysisInputFieldFound
			);

			if (elm.nextElementSibling) {
				await nextElement(elm.nextElementSibling);
			}
			return;
		} else if (result.getTriggeredRedirection()) {
			return;
		}

		const sentenceCreated = this.createVariantSentence(elm, variant, feature, observer);

		if (!sentenceCreated) {
			if (elm.nextElementSibling) {
				await nextElement(elm.nextElementSibling);
			}
			return;
		}

		variant.lastAnalysisInputFieldFound = this.varUtil.isLastFieldAnalyzed(
			elm,
			variant.lastAnalysisInputFieldFound
		);

		if (elm.nextElementSibling) {
			await nextElement(elm.nextElementSibling);
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

	private createVariantSentence(
		elm: HTMLElement,
		variant: Variant,
		feature: Feature,
		observer: MutationObserverManager
	): boolean | null {
		// save element in feature interaction array
		this.saveInteractedElement(elm, variant.getName(), feature);

		// create variant sentence
		const variantSentence: VariantSentence | null = this.featureUtil.createVariantSentence(
			elm,
			variant.whenSentenceCreated
		);

		if (!variantSentence) {
			return null;
		}

		variant.setVariantSentence(variantSentence);

		if (!variant.whenSentenceCreated) {
			variant.whenSentenceCreated = true;
		}

		// treat mutational variant sentences
		this.treatMutationsSentences(observer, variant);

		return true;
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
		if (
			elm.firstElementChild &&
			elm.firstElementChild.nodeName !== HTMLElementType.OPTION &&
			this.varUtil.isVisible(elm)
		) {
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
		let checksChildsTableRow = false;

		if (!(elm instanceof HTMLTableRowElement)) {
			return checksChildsTableRow;
		}

		const row = await this.checkValidRowTable(elm);
		if (row.isValid) {
			if (row.type == 'header') {
				await this.interactWithTableColumn(elm, variant, feature, observer);
			} else if (row.type == 'content') {
				checksChildsTableRow = true;
				await this.interactWithTableContentRow(elm, variant, feature, observer);
			}
		}

		return checksChildsTableRow;
	}

	// check if element is the first content row or the first header row of the table
	private async checkValidRowTable(elm: HTMLElement) {
		const xpathRowElement = getPathTo(elm);

		let row = {
			isValid: false,
			type: '',
		};

		if (elm.offsetParent && elm.offsetParent instanceof HTMLTableElement) {
			let xpathTableFirstRowHeader = '';
			let headersCell = elm.offsetParent.getElementsByTagName('th');
			if(headersCell.length > 0){
				xpathTableFirstRowHeader = getPathTo(
					headersCell[0].parentElement as HTMLElement
				);
			}

			let xpathTableFirstRowContent = ''
			let contentCell = elm.offsetParent.getElementsByTagName('td');
			if(contentCell.length > 0){
				xpathTableFirstRowContent = getPathTo(
					contentCell[0].parentElement as HTMLElement
				);
			}

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
	) {
		const interaction = await this.generateInteraction(row, variant, feature);
		if (!interaction) {
			return;
		}

		const result = await this.elementInteractionExecutor.execute(interaction, undefined, true);
		if (!result) {
			return;
		}

		this.createVariantSentence(row, variant, feature, observer);
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
			return;
		}

		const interaction = await this.generateInteraction(column, variant, feature);
		if (!interaction) {
			return;
		}

		const result = await this.elementInteractionExecutor.execute(interaction, undefined, true);
		if (!result) {
			return;
		}

		this.createVariantSentence(row, variant, feature, observer);
	}

	// check if the element is ready to receive interaction
	private checkValidInteractableElement(elm: HTMLElement, variant: Variant, feature: Feature) {
		if (!this.varUtil.isInteractable(elm)) {
			return false;
		}

		if (feature.analysesOnlyCancelBtns && !this.varUtil.isButtonOrAnchor(elm)) {
			return false;
		}

		if (
			!this.varUtil.isEnabled(
				elm as
					| HTMLInputElement
					| HTMLSelectElement
					| HTMLTextAreaElement
					| HTMLButtonElement
					| HTMLAnchorElement
			)
		) {
			return false;
		}

		if (
			!this.varUtil.isButtonOrAnchor(elm) &&
			!this.varUtil.isCheckBox(elm) &&
			!this.varUtil.isRadionButton(elm)
		) {
			return true;
		}

		return this.canInteract(elm, variant, feature);
	}

	/*
		Checks whether the element can interact based on previous feature interactions
		Some elements can force creations of new variants and cannot have repeated interactions (button or anchors, checkbox, radio)
	*/
	private canInteract(elm: HTMLElement, variant: Variant, feature: Feature): boolean {
		const xpathElement = getPathTo(elm);
		// checks if the element has already received interaction in the feature
		const wasInteracted = feature.interactedElements.some(
			(interactedElm) => interactedElm.xpath === xpathElement
		);

		if (!variant.lastAnalysisInputFieldFound && this.varUtil.isLogoutButton(elm)) {
			return false;
		}

		// true when it is a cancel button valid to interaction
		let isInteractableCancelBtn = this.treatInteractableBtnsAfterFinalActionButton(
			elm,
			xpathElement,
			wasInteracted,
			variant,
			feature
		);

		if (feature.analysesOnlyCancelBtns && !isInteractableCancelBtn) {
			return false;
		}

		if (!feature.analysesOnlyCancelBtns && isInteractableCancelBtn) {
			return false;
		}

		if (variant.finalActionButtonFound && !feature.analysesBtnsAfterFinalActionBtn) {
			return false;
		}

		let isFinalActionBtn = false;

		/*
			tries to find the final action button if:
			- the last input field was found
			- that the feature has not yet started to analyze buttons placed after the final action button
			- other action button was not found yet
		*/
		if (
			variant.lastAnalysisInputFieldFound &&
			!feature.analysesBtnsAfterFinalActionBtn &&
			!variant.finalActionButtonFound
		) {
			isFinalActionBtn = this.varUtil.isFinalActionButton(elm);
		}

		if (isFinalActionBtn) {
			variant.finalActionButtonFound = true;
		}

		// final action buttons can interact more the one time
		if (wasInteracted && !isFinalActionBtn) {
			return false;
		}

		if (this.varUtil.isRadionButton(elm)) {
			const anyOfGroupHasInteracted = this.varUtil.anyOfRadioofGroupHasInteracted(
				feature.interactedElements,
				variant.getName(),
				elm as HTMLInputElement
			);

			if (anyOfGroupHasInteracted) {
				return false;
			}
		} else if (this.varUtil.isButtonOrAnchor(elm)) {
			const anyButtonHasInteracted = this.varUtil.anyButtonHasInteracted(
				feature.interactedElements,
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

			if (this.varUtil.isRadionButton(elm) && (elm as HTMLInputElement).name) {
				interactedElm.radioGroupName = (elm as HTMLInputElement).name;
				interactedElm.elmType = 'radio';
			} else if (this.varUtil.isButtonOrAnchor(elm)) {
				interactedElm.elmType = 'button';
			}

			feature.interactedElements.push(interactedElm);
		}
	}

	private treatMutationsSentences(observer: MutationObserverManager, variant: Variant) {
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

			this.varUtil.updateAnalysisInputFields();

			// check if last field remains the same
			if (variant.lastAnalysisInputFieldFound && !variant.finalActionButtonFound) {
				variant.lastAnalysisInputFieldFound = this.varUtil.checksLastAnalysisField();
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

	/*
		Checks whether the element is an interactable button placed after the final action button
		returns true if it is a cancel button
	*/
	private treatInteractableBtnsAfterFinalActionButton(
		elm: HTMLElement,
		xpathElement: string,
		wasInteracted: boolean,
		variant: Variant,
		feature: Feature
	): boolean {
		let isCancelBtn = false;

		if (
			!wasInteracted &&
			this.varUtil.isBtnAfterFinalActionButton(
				elm,
				variant.finalActionButtonFound,
				feature.analysesBtnsAfterFinalActionBtn
			)
		) {
			isCancelBtn = this.varUtil.isCancelButton(elm);

			this.saveBtnAfterFinalActionButton(feature, xpathElement, isCancelBtn);
		}

		return isCancelBtn;
	}

	private async generatesCallBack(variant, feature, observer, redirectionCallback) {
		const _this = this;
		return async (interactionThatTriggeredRedirect: ElementInteraction<HTMLElement>) => {
			console.error("CALLBACK 1");
			const elm = interactionThatTriggeredRedirect.getElement();

			const unloadMessageExtra = {interaction: classToPlain(interactionThatTriggeredRedirect)};

			this.createVariantSentence(elm, variant, feature, observer);

			if (redirectionCallback) {
				await redirectionCallback(interactionThatTriggeredRedirect, variant, unloadMessageExtra);
			}
		};
	}
}
