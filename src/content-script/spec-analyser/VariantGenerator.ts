import { HTMLElementType } from '../enums/HTMLElementType';
import { MutationSenteceHandler } from './MutationSentencesHandler';
import { ElementInteractionExecutor } from '../crawler/ElementInteractionExecutor';
import { ElementInteractionGenerator } from '../crawler/ElementInteractionGenerator';
import { ElementInteraction } from '../crawler/ElementInteraction';
import { Variant } from './Variant';
import { FeatureUtil } from './FeatureUtil';
import { VariantSentence } from './VariantSentence';
import { getPathTo, isEnabled, isVisible } from '../util';
import { Feature } from './Feature';
import { VariantGeneratorUtil } from './VariantGeneratorUtil';
import { classToPlain } from 'class-transformer';
import { Config } from '../../shared/config';

export class VariantGenerator {
	constructor(
		private elementInteractionGenerator: ElementInteractionGenerator,
		private elementInteractionExecutor: ElementInteractionExecutor,
		private featureUtil: FeatureUtil,
		private varUtil: VariantGeneratorUtil,
		private config: Config
	) {}

	public async generate(
		analysisElement: HTMLElement,
		mutationSentenceHandler: MutationSenteceHandler,
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
		mutationSentenceHandler.setVariantGeneratorUtil(this.varUtil);

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

		const givenTypeSentence = this.featureUtil.createGivenTypeVariantSentence();
		if (givenTypeSentence) {
			variant.setVariantSentence(givenTypeSentence);
		}

		const tableListingHandlingEnable = this.canHandleListingTable(analysisElement, feature.ignoreFormElements);

		await this.analyze(
			startElement,
			variant,
			feature,
			mutationSentenceHandler,
			redirectionCallback,
			pathsOfElementsToIgnore,
			tableListingHandlingEnable
		);

		const lastClicableInteracted = variant.getLastClicableInteracted();

		const thenTypeSentence = this.featureUtil.createThenTypeVariantSentence(
			feature.getName(),
			lastClicableInteracted
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
		mutationSentenceHandler: MutationSenteceHandler,
		redirectionCallback?: (
			interactionThatTriggeredRedirect: ElementInteraction<HTMLElement>,
			newVariant: Variant,
			unloadMessageExtra: any
		) => Promise<void>,
		pathsOfElementsToIgnore: string[] = [],
		tableListingHandlingEnable = false
	): Promise<void> {
		if (!elm) return;

		const nextElement = async (nextElmToBeAnalyzed) => {
			return this.analyze(
				nextElmToBeAnalyzed as HTMLElement,
				variant,
				feature,
				mutationSentenceHandler,
				redirectionCallback,
				pathsOfElementsToIgnore,
				tableListingHandlingEnable
			);
		};


		if (pathsOfElementsToIgnore.includes(getPathTo(elm))) {
			if (elm.nextElementSibling) {
				await nextElement(elm.nextElementSibling);
			}
			return;
		}

		let checksChildsTableRow: boolean | null = true;
		
		if(tableListingHandlingEnable){
			checksChildsTableRow = await this.treatTableRow(elm, variant, feature, mutationSentenceHandler);

			if(checksChildsTableRow === null){
				return;
			}
		}

		// enters the children of the nodes tree
		const validFirstChild = await this.checksValidFirstChild(
			elm,
			feature.ignoreFormElements,
			checksChildsTableRow
		);
		if (validFirstChild && !this.varUtil.isClicable(elm)) {
			await nextElement(elm.firstElementChild);
		}

		// check if element will receive interaction
		const validInteractableElm = this.checkValidInteractableElement(elm, variant, feature);

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
			mutationSentenceHandler,
			redirectionCallback
		);

		// interacts with the element
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

		const sentenceCreated = this.createVariantSentence(elm, variant, feature, mutationSentenceHandler);

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
		mutationSentenceHandler: MutationSenteceHandler
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

		if(variantSentence?.uiElement){
			this.varUtil.nameUiElementIfEmpty(variantSentence.uiElement, feature)
			feature.addUiElement(variantSentence.uiElement);
		}

		variant.setVariantSentence(variantSentence);

		if (!variant.whenSentenceCreated) {
			variant.whenSentenceCreated = true;
		}

		variant.setVariantsSentences(mutationSentenceHandler.getMutationSentences());

		this.varUtil.updateAnalysisInputFields();

		// check if last field remains the same
		if (variant.lastAnalysisInputFieldFound && !variant.finalActionClicableFound) {
			variant.lastAnalysisInputFieldFound = this.varUtil.checksLastAnalysisField();
		}

		mutationSentenceHandler.resetMutationsSentences();

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
			isVisible(elm)
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
		mutationSentenceHandler: MutationSenteceHandler
	): Promise<boolean | null> {
		let checksChildsTableRow = false;

		if (!(elm instanceof HTMLTableRowElement)) {
			return checksChildsTableRow;
		}

		let result;
		const row = await this.checkValidRowTable(elm);
		if (row.isValid) {
			if (row.type == 'header') {
				result = await this.interactWithTableColumn(elm, variant, feature, mutationSentenceHandler);
			} else if (row.type == 'content') {
				checksChildsTableRow = true;
				result = await this.interactWithTableContentRow(elm, variant, feature, mutationSentenceHandler);
			}
		}

		if(!result){
			return null;
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
		mutationSentenceHandler: MutationSenteceHandler
	) {
		const interaction = await this.generateInteraction(row, variant, feature);
		if (!interaction) {
			return;
		}

		const result = await this.elementInteractionExecutor.execute(interaction, undefined, true);
		if (!result || result.getTriggeredRedirection()) {
			return;
		}

		this.createVariantSentence(row, variant, feature, mutationSentenceHandler);

		return true;
	}

	// interacts and get mutation sentences (if exists) of the second column of table
	private async interactWithTableColumn(
		row,
		variant: Variant,
		feature: Feature,
		mutationSentenceHandler: MutationSenteceHandler
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
		if (!result || result.getTriggeredRedirection()) {
			return;
		}

		this.createVariantSentence(row, variant, feature, mutationSentenceHandler);

		return true;
	}

	// check if the element is ready to receive interaction
private checkValidInteractableElement(elm: HTMLElement, variant: Variant, feature: Feature) {
		if (!this.varUtil.isInteractable(elm)) {
			return false;
		}

		if (feature.analysesOnlyCancelClicables && !this.varUtil.isClicable(elm)) {
			return false;
		}

		if (
			!isEnabled(
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
			!this.varUtil.isClicable(elm) &&
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

		if (!variant.lastAnalysisInputFieldFound && this.varUtil.isLogoutClicable(elm)) {
			return false;
		}

		// true when it is a cancel clicable valid to interaction
		let isInteractableCancelClicable = this.treatInteractableClicablesAfterFinalActionClicable(
			elm,
			xpathElement,
			wasInteracted,
			variant,
			feature
		);

		if (feature.analysesOnlyCancelClicables && !isInteractableCancelClicable) {
			return false;
		}

		if (!feature.analysesOnlyCancelClicables && isInteractableCancelClicable) {
			return false;
		}

		if (variant.finalActionClicableFound && !feature.analysesClicablesAfterFinalActionClicable) {
			return false;
		}

		let isFinalActionClicable = false;

		/*
			tries to find the final action clicable if:
			- the last input field was found
			- that the feature has not yet started to analyze clicables placed after the final action clicable
			- other action clicable was not found yet
		*/
		if (
			variant.lastAnalysisInputFieldFound &&
			!feature.analysesClicablesAfterFinalActionClicable &&
			!variant.finalActionClicableFound
		) {
			isFinalActionClicable = this.varUtil.isFinalActionClicable(elm);
		}

		if (isFinalActionClicable) {
			variant.finalActionClicableFound = true;
		}

		// final action clicables can interact more the one time
		if (wasInteracted && !isFinalActionClicable) {
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
		} else if (this.varUtil.isClicable(elm)) {
			const anyClicableHasInteracted = this.varUtil.anyClicableHasInteracted(
				feature.interactedElements,
				variant.getName()
			);

			if (anyClicableHasInteracted && !isFinalActionClicable) {
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
			} else if (this.varUtil.isClicable(elm)) {
				interactedElm.elmType = 'clicable';
			}

			feature.interactedElements.push(interactedElm);
		}
	}

	private saveClicableAfterFinalActionClicable(
		feature: Feature,
		xpathElement: string,
		isCancelClicable: boolean
	): void {
		const wasSaved = feature.clicablesAfterFinalActionClicable.find((clicable) => clicable.xpath === xpathElement);

		if (!wasSaved) {
			const clicableAfter = {
				xpath: xpathElement,
				isCancelClicable: isCancelClicable,
			};

			feature.clicablesAfterFinalActionClicable.push(clicableAfter);
		}
	}

	/*
		Checks whether the element is an interactable clicable placed after the final action clicable
		returns true if it is a cancel clicable
	*/
	private treatInteractableClicablesAfterFinalActionClicable(
		elm: HTMLElement,
		xpathElement: string,
		wasInteracted: boolean,
		variant: Variant,
		feature: Feature
	): boolean {
		let isCancelClicable = false;

		if (
			!wasInteracted &&
			this.varUtil.isClicableAfterFinalActionClicable(
				elm,
				variant.finalActionClicableFound,
				feature.analysesClicablesAfterFinalActionClicable
			)
		) {
			isCancelClicable = this.varUtil.isCancelClicable(elm);

			this.saveClicableAfterFinalActionClicable(feature, xpathElement, isCancelClicable);
		}

		return isCancelClicable;
	}

	private canHandleListingTable(elm: HTMLElement, ignoreFormElements): boolean{
		if(ignoreFormElements){
			return true;
		}

		let tables = elm.querySelectorAll('table');

		if(tables.length != 1){
			return false;
		}

		const table = tables[0];

		let firstContentRow = Array.from(table.rows).find((row) => {
			return row.cells.length > 0 && row.cells[0].nodeName === HTMLElementType.TD
		});

		if(!firstContentRow){
			return false;
		}

		const cells = firstContentRow.cells;

		if(cells.length == 0){
			return false;
		}

		let numberInteractableCells: number = 0;
		for(let cell of cells){
			let interactableElms = cell.querySelectorAll('input, select, textarea, button, a');

			if(interactableElms.length > 0){
				let hasEnableInteractableElms = Array.from(interactableElms).some(intteractableElm => {
					const enabled = isEnabled(intteractableElm as HTMLInputElement
						| HTMLSelectElement
						| HTMLTextAreaElement
						| HTMLButtonElement
						| HTMLAnchorElement
					)
	
					return enabled;
				});

				if(hasEnableInteractableElms){
					numberInteractableCells++;
				}
			}
		}

		const cellsPercentageWithInteraction = Math.round((numberInteractableCells / cells.length) * 100);

		let interactableCellTolerancePercent = 40;
		if(cellsPercentageWithInteraction <= interactableCellTolerancePercent){
			return true;
		}

		return false;
	}

	private async generatesCallBack(variant, feature, mutationSentenceHandler, redirectionCallback) {
		const _this = this;
		return async (interactionThatTriggeredRedirect: ElementInteraction<HTMLElement>) => {
			const elm = interactionThatTriggeredRedirect.getElement();

			const unloadMessageExtra = {interaction: classToPlain(interactionThatTriggeredRedirect)};

			this.createVariantSentence(elm, variant, feature, mutationSentenceHandler);

			const lastClicableInteracted = variant.getLastClicableInteracted();

			const thenTypeSentence = this.featureUtil.createThenTypeVariantSentence(
				feature.getName(),
				lastClicableInteracted
			);

			if (thenTypeSentence) {
				variant.setVariantSentence(thenTypeSentence);
			}

			if (redirectionCallback) {
				await redirectionCallback(interactionThatTriggeredRedirect, variant, unloadMessageExtra);
			}
		};
	}
}
