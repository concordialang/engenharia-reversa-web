import { getDictionary } from '../dictionary';
import { HTMLElementType } from '../enums/HTMLElementType';
import { HTMLInputType } from '../enums/HTMLInputType';
import { formatToFirstCapitalLetter } from '../util';
import { Feature } from './Feature';
import { UIElement } from './UIElement';

type InteractableElement =
	| HTMLInputElement
	| HTMLSelectElement
	| HTMLTextAreaElement
	| HTMLButtonElement
	| HTMLAnchorElement;

export class VariantGeneratorUtil {
	private analysisElement?: HTMLElement;
	private lastAnalysisInputField?: HTMLElement;
	private analysisInputFields?;
	private dictionary?;

	constructor(dictionary?) {
		this.dictionary = dictionary ? dictionary : getDictionary();
	}

	public addAnalysisElement(analysisElement: HTMLElement) {
		if (analysisElement) {
			this.analysisElement = analysisElement;

			this.updateAnalysisInputFields();
		}
	}

	public updateAnalysisInputFields() {
		if (this.analysisElement) {
			let inputFields = Array.from(
				this.analysisElement.querySelectorAll('input, textarea, select')
			);

			this.analysisInputFields = inputFields.filter((field) => {
				let htmlField = field as HTMLElement;

				if (
					!(htmlField instanceof HTMLInputElement) ||
					(htmlField.type !== HTMLInputType.Submit &&
						htmlField.type !== HTMLInputType.Button &&
						htmlField.type !== HTMLInputType.Reset)
				) {
					return htmlField;
				}
			});
		}
	}

	public isClicable(elm: HTMLElement): boolean {
		if (
			(elm instanceof HTMLInputElement && (elm.type == 'button' || elm.type == 'submit' || elm.type == 'reset')) 
			|| elm instanceof HTMLButtonElement
			|| elm instanceof HTMLAnchorElement
		) {
			return true;
		}

		return false;
	}

	public isRadionButton(elm: HTMLElement): boolean {
		if (elm instanceof HTMLInputElement && elm.type == 'radio') {
			return true;
		}

		return false;
	}

	public isCheckBox(elm: HTMLElement): boolean {
		if (elm instanceof HTMLInputElement && elm.type == 'checkbox') {
			return true;
		}

		return false;
	}

	public isInteractable(elm: HTMLElement) {
		if (
			elm instanceof HTMLInputElement ||
			elm instanceof HTMLSelectElement ||
			elm instanceof HTMLTextAreaElement ||
			elm instanceof HTMLButtonElement ||
			elm instanceof HTMLAnchorElement
		) {
			return true;
		}

		return false;
	}

	public isInputField(elm: HTMLElement) {
		if (
			elm instanceof HTMLInputElement ||
			elm instanceof HTMLSelectElement ||
			elm instanceof HTMLTextAreaElement
		) {
			return true;
		}

		return false;
	}

	public isVisible(elm: HTMLElement) {
		if (elm.hidden || elm.style.display === 'none' || elm.style.visibility === 'hidden') {
			return false;
		}

		return true;
	}

	public isEnabled(elm: InteractableElement): boolean {
		if (
			(!(elm instanceof HTMLAnchorElement) && elm.disabled) 
			|| !this.isVisible(elm)) 
		{
			return false;
		}

		if (elm instanceof HTMLInputElement || elm instanceof HTMLTextAreaElement) {
			if (elm.readOnly) {
				return false;
			}

			if (elm instanceof HTMLInputElement && elm.type === 'hidden') {
				return false;
			}
		}

		return true;
	}

	public areSimilar(text1: string, text2: string, options?): boolean {
		return text1.toLowerCase().includes(text2.toLowerCase());
	}

	public isClicableAfterFinalActionClicable(
		elm: HTMLElement,
		finalActionClicableFound: boolean,
		analysesClicablesAfterFinalActionClicable: boolean
	) {
		if (this.isClicable(elm) && (finalActionClicableFound || analysesClicablesAfterFinalActionClicable)) {
			return true;
		}

		return false;
	}

	private findStringInElementsProperties(elm, strArray) {
		let wasFound = false;

		const findString = (clicableProperty) => {
			wasFound = strArray.some((str) => {
				return this.areSimilar(clicableProperty, str);
			});
		};

		if (elm.innerText) {
			findString(elm.innerText);
		}

		if (elm.name && !wasFound) {
			findString(elm.name);
		}

		if (elm.id && !wasFound) {
			findString(elm.id);
		}

		if (elm.value && !wasFound) {
			findString(elm.value);
		}

		return wasFound;
	}

	// checks whether the element is a final action clicable (buttons or anchors that characterize the final action of a variant)
	public isFinalActionClicable(elm: HTMLElement): boolean {
		if (!this.isClicable(elm)) {
			return false;
		}

		let clicable = elm as HTMLInputElement | HTMLButtonElement | HTMLAnchorElement;

		let isFinalActionCliacle: boolean = false;

		if (clicable.type && clicable.type === 'submit') {
			isFinalActionCliacle = true;
		} else {
			isFinalActionCliacle = this.findStringInElementsProperties(
				clicable,
				this.dictionary.stringsFinalActionClicables
			);
		}

		return isFinalActionCliacle;
	}

	// checks whether the element is a cancel clicable (buttons or anchors that cause system logout)
	public isCancelClicable(elm: HTMLElement): boolean {
		if (!this.isClicable(elm)) {
			return false;
		}

		let clicable = elm as HTMLInputElement | HTMLButtonElement;

		let isCancelClicable: boolean = this.findStringInElementsProperties(
			clicable,
			this.dictionary.stringsCancelClicables
		);

		return isCancelClicable;
	}

	// checks whether the element is a logout clicable (buttons or anchors that characterize the final action of a variant)
	public isLogoutClicable(elm: HTMLElement): boolean {
		if (!this.isClicable(elm)) {
			return false;
		}

		let clicable = elm as HTMLInputElement | HTMLButtonElement | HTMLAnchorElement;

		let isLogoutClicable = this.findStringInElementsProperties(
			clicable,
			this.dictionary.stringLogoutClicable
		);

		return isLogoutClicable;
	}

	// checks if some group radio button received interaction in this variant
	public anyOfRadioofGroupHasInteracted(
		interactedElements,
		variantName: string,
		radio: HTMLInputElement
	): boolean {
		const anyInteracted = interactedElements.some((interactedElm) => {
			return (
				interactedElm.variantName === variantName &&
				interactedElm.radioGroupName == radio.name
			);
		});

		return anyInteracted;
	}

	// checks if some clicable has interacted in the variant
	public anyClicableHasInteracted(interactedElements, variantName: string): boolean {
		const anyInteracted = interactedElements.some((interactedElm) => {
			return interactedElm.variantName === variantName && interactedElm.elmType === 'clicable';
		});

		return anyInteracted;
	}

	// checks if it is the last input field to be parsed
	public isLastFieldAnalyzed(elm: HTMLElement, lastInputFieldAnalizedFound: boolean) {
		if (!this.analysisElement || !this.analysisInputFields) {
			return false;
		}

		if (!this.isInputField(elm) || lastInputFieldAnalizedFound === true) {
			return lastInputFieldAnalizedFound;
		}

		const indexField = this.analysisInputFields.findIndex((field) => field === elm);

		const nextFields = this.analysisInputFields.slice(indexField + 1);

		if (nextFields.length > 0) {
			return false;
		}

		this.lastAnalysisInputField = this.analysisInputFields[indexField] as HTMLElement;

		return true;
	}

	// check if the last analysis field remains the same
	public checksLastAnalysisField() {
		if (!this.analysisElement || !this.lastAnalysisInputField) {
			return false;
		}

		let lastFields = Array.from(
			this.analysisElement.querySelectorAll('input, textarea, select')
		).reverse();

		lastFields = lastFields.filter((field) => {
			if (
				!(field instanceof HTMLInputElement) ||
				(field.type !== HTMLInputType.Submit &&
					field.type !== HTMLInputType.Button &&
					field.type !== HTMLInputType.Reset)
			) {
				return field;
			}
		});

		const lastField = lastFields[0];

		return lastField === this.lastAnalysisInputField;
	}

	public nameUiElementIfEmpty(uiElm: UIElement, feature: Feature){
		if(uiElm.getName() === '' && !uiElm.onlyDisplayValue){
			let uiElmName = '';
			let elm = uiElm.getSourceElement();

			if(elm instanceof HTMLTableRowElement){
				uiElmName = this.nameTableElements(uiElm);
			}
			else if(elm instanceof HTMLTableCellElement){
				uiElmName = this.nameTableElements(uiElm);
			} else {
				uiElmName = this.namesUielmWithDefaultName(uiElm, feature);
			}

			uiElm.setName(uiElmName);
		}
	}

	private nameTableElements(uiElm: UIElement): string{
		let id = uiElm.getId(true);
		let name = '';

		if(id.isXPathIdProp()){
			let idXPath = id.getValue();
			let xPathParts = idXPath.split('/');
			let lastPart = xPathParts.pop();

			if(!lastPart){
				return name;
			}

			let element = lastPart.split('[');

			if(element.length != 2){
				return name;
			}

			let type = element[0];
			let number = element[1].replace(']', '');

			if(isNaN(number)){
				return name;
			}

			let tableElmName = ''
			if(type == HTMLElementType.TR.toLowerCase()){
				tableElmName = this.dictionary.row;
			}
			else if(type == HTMLElementType.TH.toLowerCase()){
				tableElmName = this.dictionary.column;
			}

			name = tableElmName != '' ? formatToFirstCapitalLetter(tableElmName) + ' ' + number : '';
		}

		return name;
	}

	private nameCellTableElement(uiElm: UIElement): string{
		let id = uiElm.getId(true);
		let name = '';

		if(id.isXPathIdProp()){
			let idXPathRow = id.getValue();
			let xPathRowParts = idXPathRow.split('/');
			let lastPart = xPathRowParts.pop();

			if(!lastPart){
				return name;
			}

			let element = lastPart.split('[');
			let row = element[0];

			if(row == HTMLElementType.TR.toLowerCase()){
				let number = element[1].replace(']', '');

				name = !isNaN(number) ? formatToFirstCapitalLetter(this.dictionary.row) + ' ' + number : '';
			}
		}

		return name;
	}

	private namesUielmWithDefaultName(uiElm: UIElement, feature: Feature): string{
		let name = feature.getUiElements().find(uiElmFeature => uiElmFeature.getId() === uiElm.getId())?.getName();

		if(!name){
			let numberOfUiElmInFeature = feature.getNumberOfUiElmentsNotOnlyDisplayValue();
			name = formatToFirstCapitalLetter(this.dictionary.element) + ' ' + numberOfUiElmInFeature;
		}
		
		return name;
	}
}
