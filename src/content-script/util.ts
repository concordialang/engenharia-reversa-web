import { DiffDomManager } from './diff-dom/DiffDomManager';
import { ValidUiElementsNodes } from './enums/ValidUiElementsNodes';
import getXPath from 'get-xpath';
import RandExp from 'randexp';
import { ObjectStorage } from './storage/ObjectStorage';
import { Config } from '../shared/config';

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
	previousDocument: Document,
	config: Config
): Promise<HTMLElement> {
	const diffDomManager: DiffDomManager = new DiffDomManager(
		previousDocument.body,
		currentDocument.body,
		config
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
	if(element){
		if (typeof element.querySelectorAll === "function") { 
			return Array.from(element.querySelectorAll(validNodes));
		} else {
			console.error("querySelectorAll is not a function for " + element.constructor.name);
		}
	}
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

export function generateRamdonStrForRegex(regex) {
	const randexp = new RandExp(regex);
	return randexp.gen();
}

export function generateRandomNumber(minNumber: number, maxNumber: number): number {
	return Math.round(Math.random() * (maxNumber - minNumber) + minNumber);
}

// format: 'yyyy-mm-dd'
export function isValidDate(str: string): boolean {
	let values = str.split('-');

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
		let isLeap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
		if (day > 29 || (day == 29 && !isLeap)) {
			return false;
		}
	}

	return true;
}

// format: 'hh:mm' or 'hh:mm:ss'
export function isValidTime(str: string) {
	let values = str.split(':');

	if (values.length !== 2 && values.length !== 3) {
		return false;
	}

	let checkSeconds = values.length === 3 ? true : false;

	let regex: RegExp;
	if (checkSeconds) {
		regex = /^([0-1]?[\d]|2[0-4]):([0-5][\d])(:[0-5][\d])(:[0-5][\d])?$/;
	} else {
		regex = /^([0-1]?[\d]|2[0-4]):([0-5][\d])(:[0-5][\d])?$/;
	}

	let isValid = regex.test(str);

	return isValid;
}

// format: 'yyyy-mm-dd hh:mm' or 'yyyy-mm-dd hh:mm:ss'
export function isValidDateTime(str: string) {
	let dateTime = str.split('T');

	if (dateTime.length !== 2) {
		return false;
	}

	let date = dateTime[0];
	let time = dateTime[1];

	let isValid = isValidDate(date) && isValidTime(time);

	return isValid;
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

export function isIterable(obj): boolean {
	// checks for null and undefined
	if (obj == null) {
	  return false;
	}
	return typeof obj[Symbol.iterator] === 'function';
  }

export default clearElement;

export function getURLasString(url: URL, config: Config): string {
	if(isURLToBeConsideredFull(url, config)){
		return url.href;
	} else {
		return url.origin + url.pathname;
	}
}

function isURLToBeConsideredFull(url: URL, config: Config): boolean {
	for(let fullUrl of config.considerFullUrl){
		if(url.href.includes(fullUrl.href)){
			console.log("url:", url.href, true);
			return true;
		}
	}
	console.log("url:", url.href, false);
	return false;
}

export async function getConfig(configStorage : ObjectStorage<string>){
	let savedVariantLimit = await configStorage.get("variant-limit");
	let limitOfVariants: number|undefined = undefined;
	if(savedVariantLimit){
		limitOfVariants = parseInt(savedVariantLimit);
	}

	const savedMinimumChildNodesNumberForDiff = await configStorage.get("min-child-node-diff");
	let minimumChildNodesNumberForDiff: number|undefined = undefined;
	if(savedMinimumChildNodesNumberForDiff){
		minimumChildNodesNumberForDiff = parseInt(savedMinimumChildNodesNumberForDiff);
	}

	const savedStrHtmlTagsForDiff = await configStorage.get("html-tags-for-diff");
	let strHtmlTagsForDiff: string|undefined = undefined;
	if(savedStrHtmlTagsForDiff){
		strHtmlTagsForDiff = savedStrHtmlTagsForDiff;
	}

	const savedMaxWaitTimeForUnload = await configStorage.get("max-wait-time-unload");
	let maxWaitTimeForUnload: number|undefined = undefined;
	if(savedMaxWaitTimeForUnload){
		maxWaitTimeForUnload = parseInt(savedMaxWaitTimeForUnload);
	}
	
	let savedConsiderFullUrl = await configStorage.get("consider-full-url");
	let considerFullUrl: URL[] = [];
	if(savedConsiderFullUrl){
		let a = savedConsiderFullUrl.split('\n');
		let b = a.filter((link) => {
			try{
				let url = new URL(link);
			} catch (e){
				return false;
			}
			return true;
		});
		considerFullUrl = b.map((url) => new URL(url));
	}
	
	return new Config(
		undefined,
		undefined,
		limitOfVariants,
		minimumChildNodesNumberForDiff,
		strHtmlTagsForDiff,
		maxWaitTimeForUnload,
		considerFullUrl
	);
}