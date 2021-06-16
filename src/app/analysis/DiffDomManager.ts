import { DiffDOM } from 'diff-dom';
import getXPath from 'get-xpath';
import { HTMLNodeTypes } from '../html/HTMLNodeTypes';

export class DiffDomManager {
	private diffDom: DiffDOM;
	private previousHtml: HTMLElement;
	private currentHtml: HTMLElement;

	constructor(previousHtml: HTMLElement, currentHtml: HTMLElement) {
		let dd = new DiffDOM({
			valueDiffing: false,
		});

		this.previousHtml = this.formatedHtml(previousHtml);
		this.currentHtml = this.formatedHtml(currentHtml);

		let diffDom = dd.diff(this.previousHtml, this.currentHtml);
		this.diffDom = this.formatArrayDiffDom(diffDom);
	}

	private formatedHtml(html: HTMLElement): HTMLElement {
		let htmlString = html.outerHTML;

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

		var parser = new DOMParser();
		var doc = parser.parseFromString(htmlString, 'text/html');

		return doc.body;
	}

	private formatArrayDiffDom(diffDom): Object[] {
		// disregard script tag
		diffDom = diffDom.filter(
			(diff) =>
				diff.element === undefined || (diff.element !== undefined && diff.element.nodeName !== HTMLNodeTypes.SCRIPT)
		);

		return diffDom;
	}

	private getOutermostElementDiff() {
		let outermostElementDiff = this.diffDom[0];

		for (let diff of this.diffDom) {
			outermostElementDiff = diff.route.length <= outermostElementDiff.route.length ? diff : outermostElementDiff;
		}

		return outermostElementDiff;
	}

	public getDiff(): DiffDOM {
		return this.diffDom;
	}

	public getPreviousHtml(): HTMLElement {
		return this.previousHtml;
	}

	public getCurrentHtml(): HTMLElement {
		return this.currentHtml;
	}

	// returns the parent xpath of the outermost element that has changed
	public getParentXPathOfTheOutermostElementDiff(): string | null {
		if (this.diffDom[0] == undefined) {
			return null;
		}

		let outermostElementDiff: any = this.getOutermostElementDiff();
		if (outermostElementDiff != null) {
			let htmlElement: HTMLElement | ChildNode = this.currentHtml;
			for (let i = 0; i < outermostElementDiff.route.length; i++) {
				htmlElement = htmlElement.childNodes[outermostElementDiff.route[i]];
			}

			return getXPath(htmlElement.parentElement);
		}

		return null;
	}
}
