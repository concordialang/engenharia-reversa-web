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
