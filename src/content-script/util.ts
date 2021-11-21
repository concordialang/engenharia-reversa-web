import { DiffDomManager } from './diff-dom/DiffDomManager';
import getXPath from 'get-xpath';
import { ValidUiElementsNodes } from './enums/ValidUiElementsNodes';

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getPathTo(element: HTMLElement): string {
	return getXPath(element);
}

export function getEnumKeyByEnumValue(myEnum, enumValue) {
	let keys = Object.keys(myEnum).filter((x) => myEnum[x] == enumValue);
	return keys.length > 0 ? myEnum[keys[0]] : null;
}

// find the most internal parent in common of nodes
export function commonAncestorElement(elements: Element[]) {
	const reducer = (prev, current) =>
		current.parentElement.contains(prev) ? current.parentElement : prev;
	return elements.reduce(reducer, elements[0]);
}

// get elements that confirm a feature
export function getFormElements(element: HTMLElement): NodeListOf<Element> {
	return element.querySelectorAll('form');
}

export function getElementByXpath(path: string, document: Document): HTMLElement | null {
	if (path === '') return null;
	const node = document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
		.singleNodeValue;
	if (node) {
		return <HTMLElement>node;
	}
	return null;
}

export async function getDiff(
	currentDocument: Document,
	previousDocument: Document
): Promise<HTMLElement> {
	const diffDomManager: DiffDomManager = new DiffDomManager(
		previousDocument.body,
		currentDocument.body
	);

	const xPathParentElementDiff = diffDomManager.getParentXPathOfTheOutermostElementDiff();

	const analysisContext: HTMLElement | null =
		xPathParentElementDiff !== null
			? getElementByXpath(xPathParentElementDiff, currentDocument)
			: null;

	return analysisContext !== null ? analysisContext : currentDocument.body;
}

export function getValidUiElementsNodes(element: HTMLElement) {
	const validNodes = Object.values(ValidUiElementsNodes).join(',');

	return Array.from(element.querySelectorAll(validNodes));
}

export function formatToFirstCapitalLetter(txt: string): string {
	txt = txt.replace(':', '');
	txt = txt.charAt(0).toUpperCase() + txt.slice(1);
	return txt;
}

export function generateRandomStr(length: number): string {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;

	let str = '';

	for (let i = 0; i < length; i++) {
		str += characters.charAt(Math.floor(Math.random() * charactersLength));
	}

	return str;
}

export function generateRandomNumber(minNumber: number, maxNumber: number): number {
	return Math.round(Math.random() * (maxNumber - minNumber) + minNumber);
}

export function isValidDate(str: string): boolean {
	let separator = '-';

	let values = str.split(separator);

	if (values.length !== 3 || values.some((v) => isNaN(parseInt(v)))) {
		return false;
	}

	let day = parseInt(values[2]);
	let month = parseInt(values[1]);
	let year = parseInt(values[0]);

	if (year < 1901 || year > 2100) {
		return false;
	}

	if (month < 1 || month > 12) {
		return false;
	}

	if (day < 1 || day > 31) {
		return false;
	}

	if ((month == 4 || month == 6 || month == 9 || month == 11) && day == 31) {
		return false;
	}

	// check for february 29th
	if (month == 2) {
		let isleap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
		if (day > 29 || (day == 29 && !isleap)) {
			return false;
		}
	}

	return true;
}

/**
 * Clear elements from the given element.
 *
 * @param element element to clear
 * @returns the number of removed elements.
 */
const clearElement = (element: HTMLElement): number => {
	let removed: number = 0;
	let e;
	while ((e = element.firstChild)) {
		element.removeChild(e);
		++removed;
	}
	return removed;
};

export default clearElement;
