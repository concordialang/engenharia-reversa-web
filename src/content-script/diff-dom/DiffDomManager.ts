import { DiffDOM } from 'diff-dom';
import { HTMLElementType } from '../enums/HTMLElementType';
import { getPathTo } from '../util';
import { minimumChildNodesNumberForDiff, strHtmlTagsForDiff } from '../config';

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
				(diff.element !== undefined && diff.element.nodeName !== HTMLElementType.SCRIPT)
		);

		return diffDom;
	}

	private electedElementsDiff() {
		let newElementsDiff = this.diffDom.filter(
			(diff) => diff.action == 'replaceElement' || diff.action == 'addElement'
		);

		let newElementsDiffHtml: any = [];
		for(let elmDiff of newElementsDiff){
			let htmlElement: HTMLElement | ChildNode = this.currentHtml;
			
			for (let route of elmDiff.route) {
				htmlElement = htmlElement.childNodes[route];
			}

			if(htmlElement instanceof HTMLElement){
				const objElmDiff = {
					elm: htmlElement, 
					route: elmDiff.route, 
				};
	
				newElementsDiffHtml.push(objElmDiff);
			}
		}

		if(!newElementsDiffHtml || newElementsDiffHtml.length == 0){
			return null;
		}

		let elected: {
			elm: HTMLElement
			route: []
		} = newElementsDiffHtml.pop();

		for(let diff of newElementsDiffHtml){
			if(diff.route.length < elected.route.length) {
				let childrenDiff = diff.elm.querySelectorAll(strHtmlTagsForDiff);

				// checks if the element will be disregarded
				if(childrenDiff.length >= minimumChildNodesNumberForDiff){
					elected = diff;
				}
			}
		}

		return elected.elm;
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
			let electedElement: HTMLElement | null = this.electedElementsDiff();

			if(!electedElement){
				return null;
			}
			
			return getPathTo(electedElement.parentElement ? electedElement.parentElement : electedElement);
		}

		return null;
	}
}
