import { getDictionary } from '../dictionary';
import { HTMLInputType } from '../enums/HTMLInputType';

type InteractableElement =
	| HTMLInputElement
	| HTMLSelectElement
	| HTMLTextAreaElement
	| HTMLButtonElement;

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

	public isButton(elm: HTMLElement): boolean {
		if (
			(elm instanceof HTMLInputElement &&
				(elm.type == 'button' || elm.type == 'submit' || elm.type == 'reset')) ||
			elm instanceof HTMLButtonElement
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
			elm instanceof HTMLButtonElement
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
		if (elm.disabled || !this.isVisible(elm)) {
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

	// checks whether the element is a final action button (buttons that characterize the final action of a variant)
	public isFinalActionButton(elm: HTMLElement): boolean {
		if (!this.isButton(elm)) {
			return false;
		}

		let button = elm as HTMLInputElement | HTMLButtonElement;

		let isFinalActionBtn: boolean = false;

		if (button.type === 'submit') {
			isFinalActionBtn = true;
		} else {
			const findFinalActionString = (btnProperty) => {
				isFinalActionBtn = this.dictionary.stringsFinalActionButtons.some((str) => {
					return this.areSimilar(btnProperty, str);
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

	public isBtnAfterFinalActionButton(
		elm: HTMLElement,
		finalActionButtonFound: boolean,
		analysesBtnsAfterFinalActionBtn: boolean
	) {
		if (this.isButton(elm) && (finalActionButtonFound || analysesBtnsAfterFinalActionBtn)) {
			return true;
		}

		return false;
	}

	// checks whether the element is a cancel button (buttons that characterize the final action of a variant)
	public isCancelButton(elm: HTMLElement): boolean {
		if (!this.isButton(elm)) {
			return false;
		}

		let button = elm as HTMLInputElement | HTMLButtonElement;

		let isCancelBtn: boolean = false;

		const findCancelString = (btnProperty) => {
			isCancelBtn = this.dictionary.stringsCancelButtons.some((str) => {
				return this.areSimilar(btnProperty, str);
			});
		};

		if (button.innerText) {
			findCancelString(button.innerText);
		}

		if (button.name && !isCancelBtn) {
			findCancelString(button.name);
		}

		if (button.id && !isCancelBtn) {
			findCancelString(button.id);
		}

		if (button.value && !isCancelBtn) {
			findCancelString(button.value);
		}

		return isCancelBtn;
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

	// checks if some button has interacted in the variant
	public anyButtonHasInteracted(interactedElements, variantName: string): boolean {
		const anyInteracted = interactedElements.some((interactedElm) => {
			return interactedElm.variantName === variantName && interactedElm.elmType === 'button';
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
}
