import { Feature } from "../feature-structure/Feature";
import { GeneratorsMap } from "./GeneratorsMap";
import { ContextGenerator } from "./ContextGenerator";
import { UIElement } from "../feature-structure/UIElement";
import { UIProperty } from "../feature-structure/UIProperty";

export class UIElementGenerator {

    private _validPropertyNode(property : any){
        if(property === null || property === undefined || property === ""){
            return false;
        }

        return true;
    }

    private _contextualizes(context : ContextGenerator, uiElement: UIElement) : ContextGenerator {
        context.inUIElement = true;
        context.currentUIElement = uiElement;

        return context;
    }


    public generate (node : HTMLInputElement, feature : Feature, generatorsMap : GeneratorsMap, context : ContextGenerator) : void {

        let uiElm = new UIElement();
        context = this._contextualizes(context, uiElm);

        if (this._validPropertyNode(node.name)) {
            uiElm.setName(node.name);
        }

        if (this._validPropertyNode(node.id)) {
            
            // Se node nao tiver nome e tiver id, id vai passar a ser o nome tambem
            if(uiElm.getName() == ""){
                let nodeName = node.id.toString(); 
                uiElm.setName(nodeName.charAt(0).toUpperCase() + nodeName.slice(1));
            }

            uiElm.setProperty(new UIProperty('id', '#' + node.id));
        }

        if (this._validPropertyNode(node.type)) {
            uiElm.setProperty(new UIProperty('type', node.type));
        }

        if (this._validPropertyNode(node.disabled)) {
            let editabled = !node.disabled ? true : false;
            uiElm.setProperty(new UIProperty('editabled', editabled));
        }

        // if (this.validPropertyNode(node.dataType)) {
        //     uiElm.setProperty(new UIProperty('dataType', node.dataType));
        // }

        if (this._validPropertyNode(node.value)) {
            uiElm.setProperty(new UIProperty('value', node.value));
        }

        if (this._validPropertyNode(node.minLength)) {
            if(node.minLength !== 0){
                uiElm.setProperty(new UIProperty('min_length', node.minLength));
            }
        }

        if (this._validPropertyNode(node.maxLength)) {
            if(node.maxLength !== 524288){
                uiElm.setProperty(new UIProperty('max_length', node.maxLength));
            }
        }

        if (this._validPropertyNode(node.min)) {
            uiElm.setProperty(new UIProperty('min_value', node.min));
        }

        if (this._validPropertyNode(node.max)) {
            uiElm.setProperty(new UIProperty('max_value', node.max));
        }

        if (this._validPropertyNode(node.pattern)) {
            uiElm.setProperty(new UIProperty('format', node.pattern));
        }

        // return uiElm;
        feature.setUiElement(uiElm);
    }
}