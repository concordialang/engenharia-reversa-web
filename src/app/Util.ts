import { ElementInteraction } from './crawler/ElementInteraction';
import { ElementInteractionStorage } from './crawler/ElementInteractionStorage';

export class Util {
	static formatName(name: string): string {
		name = name.replace(':', '');
		name = name.charAt(0).toUpperCase() + name.slice(1);
		return name;
	}

	static isNotEmpty(foo: any) {
		if (foo === undefined || foo === null || foo === '') {
			return false;
		}

		return true;
	}

	static sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// find the most internal parent in common of nodes
	static getCommonAncestorElement(elements: Element[]) {
		const reducer = (prev, current) => (current.parentElement.contains(prev) ? current.parentElement : prev);

		//testar
		// const reducer = function(prev, current) {
		// 	console.log("prev", prev)
		// 	console.log("prev parentElement", prev.parentElement)
		// 	console.log("current", current)
		// 	console.log("current parentElement", current.parentElement)

		// 	if(current.parentElement.contains(prev)){
		// 		console.log("sim")
		// 		console.log("")
		// 		return current.parentElement
		// 	}
		// 	else {
		// 		console.log("nao")
		// 		console.log("")
		// 		return prev;
		// 	}
		// };

		return elements.reduce(reducer, elements[0]);
	}

	static getPathTo(element: HTMLElement): string | null {
		if (element.id !== '') return 'id("' + element.id + '")';
		if (element === document.body) return element.tagName;

		var ix = 0;
		const parentNode = element.parentNode;
		if (parentNode) {
			var siblings = parentNode.childNodes;
			for (var i = 0; i < siblings.length; i++) {
				var sibling = <HTMLElement>siblings[i];
				if (sibling === element) return this.getPathTo(<HTMLElement>parentNode) + '/' + element.tagName + '[' + ix + ']';
				if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
			}
		}

		return null;
	}
}
