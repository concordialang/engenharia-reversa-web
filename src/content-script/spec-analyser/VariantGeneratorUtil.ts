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
}
