import { NodeTypes } from '../node/NodeTypes';
import { UIElement } from "../feature-structure/UIElement";
import { UIProperty } from "../feature-structure/UIProperty";

export class UIElementGenerator {

    private _validPropertyNode(property : any){
        if(property === null || property === undefined || property === ""){
            return false;
        }

        return true;
    }

    public createUIElementsFromForm (node : HTMLElement) : Array <UIElement> {
        let uiElements : Array < UIElement > = [];
        let inputs : Array < HTMLInputElement > = Array.from(node.querySelectorAll(NodeTypes.INPUT));
        
        for(let input of inputs){
            if (input.nodeName == NodeTypes.INPUT){
                let uiElm = new UIElement();
                
                if (this._validPropertyNode(input.name)) {
                    uiElm.setName(input.name);
                }

                if (this._validPropertyNode(input.id)) {
                    
                    // Se node nao tiver nome e tiver id, id vai passar a ser o nome tambem
                    if(uiElm.getName() == ""){
                        let nodeName = input.id.toString(); 
                        uiElm.setName(nodeName.charAt(0).toUpperCase() + nodeName.slice(1));
                    }

                    uiElm.setProperty(new UIProperty('id', input.id));
                }

                if (this._validPropertyNode(input.type)) {
                    uiElm.setProperty(new UIProperty('type', input.type));
                }

                if (this._validPropertyNode(input.disabled)) {
                    let editabled = !input.disabled ? true : false;
                    uiElm.setProperty(new UIProperty('editabled', editabled));
                }

                // if (this.validPropertyNode(input.dataType)) {
                //     uiElm.setProperty(new UIProperty('dataType', input.dataType));
                // }

                if (this._validPropertyNode(input.value)) {
                    uiElm.setProperty(new UIProperty('value', input.value));
                }

                if (this._validPropertyNode(input.minLength)) {
                    if(input.minLength !== 0){
                        uiElm.setProperty(new UIProperty('min_length', input.minLength));
                    }
                }

                if (this._validPropertyNode(input.maxLength)) {
                    if(input.maxLength !== 524288){
                        uiElm.setProperty(new UIProperty('max_length', input.maxLength));
                    }
                }

                if (this._validPropertyNode(input.min)) {
                    uiElm.setProperty(new UIProperty('min_value', input.min));
                }

                if (this._validPropertyNode(input.max)) {
                    uiElm.setProperty(new UIProperty('max_value', input.max));
                }

                if (this._validPropertyNode(input.required)) {
                    uiElm.setProperty(new UIProperty('required', input.required));
                }

                uiElements.push(uiElm);
            }
        }

        return uiElements;
    }
}