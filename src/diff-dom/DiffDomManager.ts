import { DiffDOM } from 'diff-dom';
import { HTMLNodeTypes } from '../html/HTMLNodeTypes';
import { getPathTo } from '../util';

export class DiffDomManager {
	private diffDom: DiffDOM;
	private previousHtml: HTMLElement;
	private currentHtml: HTMLElement;

	constructor(previousHtml: HTMLElement, currentHtml: HTMLElement) {
		let dd = new DiffDOM({ valueDiffing: false });

		this.previousHtml = this.formatedHtml(previousHtml);
		this.currentHtml = this.formatedHtml(currentHtml);

		let diffDom = dd.diff(this.previousHtml.outerHTML, this.currentHtml.outerHTML);
		this.diffDom = this.formatArrayDiffDom(diffDom);
	}

	private formatedHtml(html: HTMLElement): HTMLElement {
		let htmlString = html instanceof HTMLElement ? html.outerHTML : html;

		// remove comments
		htmlString = htmlString.replace(/<!--[\s\S]*?-->/g, '');

		// remove newline / carriage return
		htmlString = htmlString.replace(/\n/g, '');

		// remove whitespace (space and tabs) before tags
		htmlString = htmlString.replace(/[\t ]+\</g, '<');

		// remove whitespace between tags
		htmlString = htmlString.replace(/\>[\t ]+\</g, '><');

		// remove whitespace after tags
		htmlString = htmlString.replace(/\>[\t ]+$/g, '>');

		let parser = new DOMParser();
		let doc = parser.parseFromString(htmlString, 'text/html');
		doc.body.querySelectorAll('script, style').forEach((tag) => {
			tag.remove();
		});

		return doc.body;
	}

	private formatArrayDiffDom(diffDom): Object[] {
		// disregard script tag
		diffDom = diffDom.filter(
			(diff) =>
				diff.element === undefined ||
				(diff.element !== undefined && diff.element.nodeName !== HTMLNodeTypes.SCRIPT)
		);

		return diffDom;
	}

	private getOutermostElementDiff() {
		let outermostElementDiff = this.diffDom.find(
			(diff) => diff.action == 'replaceElement' || diff.action == 'addElement'
		);

		if (!outermostElementDiff) return null;

		for (let diff of this.diffDom) {
			outermostElementDiff =
				diff.route.length <= outermostElementDiff.route.length &&
				(diff.action == 'replaceElement' || diff.action == 'addElement')
					? diff
					: outermostElementDiff;
		}

		return outermostElementDiff;
	}

	public getDiff(): DiffDOM {
		return this.diffDom;
	}

	public getPreviousHtml() {
		return this.previousHtml;
	}

	public getCurrentHtml() {
		return this.currentHtml;
	}

	// returns the parent xpath of the outermost element that has changed
	public getParentXPathOfTheOutermostElementDiff(): string | null {
		if (this.diffDom.length > 0 && this.currentHtml instanceof HTMLElement) {
			let outermostElementDiff: any = this.getOutermostElementDiff();

			if (outermostElementDiff) {
				let htmlElement: HTMLElement | ChildNode = this.currentHtml;

				for (let route of outermostElementDiff.route) {
					htmlElement = htmlElement.childNodes[route];
				}

				if (htmlElement.parentElement) {
					return getPathTo(htmlElement.parentElement);
				}
			}
		}

		return null;
	}
}
