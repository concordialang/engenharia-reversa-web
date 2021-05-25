import { DiffDOM } from "diff-dom";
import getXPath from 'get-xpath';

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

    public getPreviousHtml(): HTMLElement{
        return this.previousHtml;
    }

    public getCurrentHtml(): HTMLElement{
        return this.currentHtml;
    }

    // // returns the parent of the element that has changed
    // public getXPathParentFirstElementDiff(): string | null {

    //     if(this.diffDom[0] == undefined){
    //         return null;
    //     }

    //     let firstElementDiff = this.diffDom[0];

    //     // find the first element of the DiffDOM in current html
    //     let htmlElement: HTMLElement | ChildNode = this.currentHtml;
    //     for(let i = 0; i < firstElementDiff.route.length; i++){
    //         htmlElement = htmlElement.childNodes[firstElementDiff.route[i]];
    //     }

    //     return getXPath(htmlElement.parentElement);

    // }

    // returns the parent of the element that has changed
    public getXPathParentOfMoreExternalElementDiff(): string | null {

        if(this.diffDom[0] == undefined){
            return null;
        }

        //change
        console.log("DIFF", this.diffDom);
        let moreExternalElementDiff = this.diffDom[0];

        let htmlElement: HTMLElement | ChildNode = this.currentHtml;
        for(let i = 0; i < moreExternalElementDiff.route.length; i++){
            htmlElement = htmlElement.childNodes[moreExternalElementDiff.route[i]];
        }

        return getXPath(htmlElement.parentElement);

    }
}