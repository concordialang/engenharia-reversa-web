import { DiffDOM } from "diff-dom";

export class DiffDomManipulator {
    
    private diffDom: DiffDOM;
    private previousHtml: HTMLElement;
    private currentHtml: HTMLElement;

    constructor(previousHtml: HTMLElement, currentHtml: HTMLElement){
        let dd = new DiffDOM({
            valueDiffing: false
        });

        this.previousHtml = this.formatedHtml(previousHtml);
        this.currentHtml = this.formatedHtml(currentHtml);

        //console.log("previousBodyFormated", previousBodyFormated)
        //console.log("currentBodyFormated", currentBodyFormated)

		this.diffDom = dd.diff(this.previousHtml, this.currentHtml);
    }

    private formatedHtml(html: HTMLElement) : HTMLElement{
        let htmlString = html.outerHTML;

        // remove newline / carriage return
        htmlString = htmlString.replace(/\n/g, "");

        // remove whitespace (space and tabs) before tags
        htmlString = htmlString.replace(/[\t ]+\</g, "<");

        // remove whitespace between tags
        htmlString = htmlString.replace(/\>[\t ]+\</g, "><");

        // remove whitespace after tags
        htmlString = htmlString.replace(/\>[\t ]+$/g, ">");

        var parser = new DOMParser();
	    var doc = parser.parseFromString(htmlString, 'text/html');
        
        const htmlElement = doc.body;

        return htmlElement;
    }

    public getDiff(): DiffDOM{
        return this.diffDom;
    }

    // returns the parent of the element that has changed
    public getFirstElementDiffParent(): HTMLElement | null {
        let firstElementDiff = this.diffDom[0];

        // find the first element of the DiffDOM in current html
        let htmlElement: HTMLElement | ChildNode = this.currentHtml;
        for(let i = 0; i < firstElementDiff.route.length; i++){
            htmlElement = htmlElement.childNodes[firstElementDiff.route[i]];
        }

        return htmlElement.parentElement;
    }
}