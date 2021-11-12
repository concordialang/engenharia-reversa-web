import { areSimilar } from '../util';
import { Feature } from './Feature';
import { Variant } from './Variant';

type InteractableElement =
	| HTMLInputElement
	| HTMLSelectElement
	| HTMLTextAreaElement
	| HTMLButtonElement;

export class VariantGeneratorUtil {
	public isButton(elm: HTMLElement): boolean {
		if (
			(elm instanceof HTMLInputElement && (elm.type == 'button' || elm.type == 'submit')) ||
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

	public inEnabled(elm: InteractableElement): boolean {
		if (
			elm.disabled ||
			elm.hidden ||
			elm.style.display === 'none' ||
			elm.style.visibility === 'hidden'
		) {
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

	// checks whether the element is a final action button (buttons that characterize the final action of a variant)
	public isFinalActionButton(elm: HTMLElement, dictionary): boolean {
		if (!this.isButton(elm)) {
			return false;
		}

		let button = elm as HTMLInputElement | HTMLButtonElement;

		let isFinalActionBtn: boolean = false;

		if (button.type === 'submit') {
			isFinalActionBtn = true;
		} else {
			const findFinalActionString = (btnProperty) => {
				isFinalActionBtn = dictionary.stringsFinalActionButtons.some((str) => {
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

	// checks whether the element is a cancel button (buttons that characterize the final action of a variant)
	public isCancelButton(elm: HTMLElement, dictionary): boolean {
		if (!this.isButton(elm)) {
			return false;
		}

		let button = elm as HTMLInputElement | HTMLButtonElement;

		let isCancelBtn: boolean = false;

		const findCancelString = (btnProperty) => {
			isCancelBtn = dictionary.stringsCancelButtons.some((str) => {
				return areSimilar(btnProperty, str);
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
		feature: Feature,
		variantName: string,
		radio: HTMLInputElement
	): boolean {
		const anyInteracted = feature.interactedElements.some((interactedElm) => {
			return (
				interactedElm.variantName === variantName &&
				interactedElm.radioGroupName == radio.name
			);
		});

		return anyInteracted;
	}

	// checks if some button has interacted in the variant
	public anyButtonHasInteracted(feature: Feature, variantName: string): boolean {
		const anyInteracted = feature.interactedElements.some((interactedElm) => {
			return interactedElm.variantName === variantName && interactedElm.elmType === 'button';
		});

		return anyInteracted;
	}
}
