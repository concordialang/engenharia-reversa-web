import { NodeTypes } from '../node/NodeTypes';
import { UIElement } from "../feature-structure/UIElement";
import { UIProperty } from "../feature-structure/UIProperty";
import { Util } from '../Util';

export class UIElementGenerator {

    private checkValidNode(node: HTMLElement) : boolean{
        // return false if node is not treatable for UIElement
        if(node.nodeName !== NodeTypes.INPUT && node.nodeName !== NodeTypes.SELECT && node.nodeName !== NodeTypes.TEXTAREA){
            return false;
        }

        return true;
    }

    public createUIElementsFromForm (node : HTMLElement) : Array <UIElement> {
        let uiElements : Array < UIElement > = [];
        let formElements : Array < HTMLFormElement > = Array.from(node.querySelectorAll(NodeTypes.INPUT));
        
        for(let elm of formElements){
            
            if (!this.checkValidNode(elm)){
                // skips element if he's not valid
                continue;
            }

            let uiElm = new UIElement();
                
            uiElm.setName(this.generateName(elm));

            if(Util.isNotEmpty(elm.id)){
                uiElm.setProperty(new UIProperty('id', elm.id));
            }

            if(Util.isNotEmpty(elm.type)){
                uiElm.setProperty(new UIProperty('type', elm.type));
            }

            if(Util.isNotEmpty(elm.disabled)){
                let editabled = !elm.disabled ? true : false;
                uiElm.setProperty(new UIProperty('editabled', editabled));
            }

            // if (this.validPropertyNode(input.dataType)) {
            //     uiElm.setProperty(new UIProperty('dataType', input.dataType));
            // }

            if(Util.isNotEmpty(elm.value)){
                uiElm.setProperty(new UIProperty('value', elm.value));
            }

            if(Util.isNotEmpty(elm.minLength)){
                if(elm.minLength !== 0){
                    uiElm.setProperty(new UIProperty('min_length', elm.minLength));
                }
            }

            if(Util.isNotEmpty(elm.maxLength)){
                if(elm.maxLength !== 524288){
                    uiElm.setProperty(new UIProperty('max_length', elm.maxLength));
                }
            }

            if(Util.isNotEmpty(elm.min)){
                uiElm.setProperty(new UIProperty('min_value', elm.min));
            }

            if(Util.isNotEmpty(elm.max)){
                uiElm.setProperty(new UIProperty('max_value', elm.max));
            }

            if(Util.isNotEmpty(elm.required)){
                uiElm.setProperty(new UIProperty('required', elm.required));
            }

            uiElements.push(uiElm);
        }

        return uiElements;
    }

    private generateName(elm: HTMLFormElement) : string{
        let name = '';
        
        if(elm.previousElementSibling?.nodeName === NodeTypes.LABEL){

            name = this.generateNameFromLabel(elm);

        } else {

            name = this.generateNameFromNode(elm);
            
        }

        return name;
    }

    private generateNameFromLabel(elm: HTMLFormElement) : string{
        let label: HTMLLabelElement = elm.previousElementSibling as HTMLLabelElement;
        let name: string = '';

        if(Util.isNotEmpty(label.innerHTML)){

            name = Util.formatName(label.innerHTML);

        } else if(label.htmlFor !== undefined){

            if(Util.isNotEmpty(elm.id) && elm.id === label.htmlFor){
                name = Util.formatName(label.htmlFor);
            }

        }

        return name;
    }

    private generateNameFromNode(elm: HTMLFormElement) : string{
        let name: string = '';
        
        if(Util.isNotEmpty(elm.name)){

            name = Util.formatName(elm.name);

        } else if(Util.isNotEmpty(elm.id)){

            name = Util.formatName(elm.id.toString());

        }

        return name;
    }
}