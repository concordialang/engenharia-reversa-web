export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// TO-DO: Por que não usou a função getXPath do pacote 'get-xpath' ?? Substituir ?
export function getPathTo(element: HTMLElement): string | null {
	if (element.id !== '') {
		return 'id("' + element.id + '")';
	}
	if (element === document.body) {
		return element.tagName;
	}
	let ix = 0;
	const parentNode = element.parentNode;
	if (parentNode) {
		var siblings = parentNode.childNodes;
		for (let i = 0; i < siblings.length; i++) {
			const sibling = <HTMLElement>siblings[i];
			if (sibling === element) {
				return getPathTo(<HTMLElement>parentNode) + '/' + element.tagName + '[' + ix + ']';
			}
			// TO-DO: Refactor - o que significa 1 ???
			if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
				ix++;
			}
		}
	}
	return null;
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

export function getElementByXpath(path: string, document: HTMLDocument): HTMLElement | null {
	const node = document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
		.singleNodeValue;
	if (node) {
		return <HTMLElement>node;
	}
	return null;
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
