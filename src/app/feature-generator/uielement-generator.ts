import { UIElement } from "../feature-structure/UIElement";
import { UIProperty } from "../feature-structure/UIProperty";

export class UIElementGenerator {

    private validPropertyNode(property : any){
        if(property === null || property === undefined || property === ""){
            return false;
        }

        return true;
    }

    public generateUIElement (node : HTMLInputElement) : UIElement{

        let uiElm = new UIElement();

        if (this.validPropertyNode(node.name)) {
            uiElm.setName(node.name);
        }

        if (this.validPropertyNode(node.id)) {
            
            // Se node nao tiver nome e tiver id, id vai passar a ser o nome tambem
            if(uiElm.getName() == ""){
                let nodeName = node.id.toString(); 
                uiElm.setName(nodeName.charAt(0).toUpperCase() + nodeName.slice(1));
            }

            uiElm.setProperty(new UIProperty('id', '#' + node.id));
        }

        if (this.validPropertyNode(node.type)) {
            uiElm.setProperty(new UIProperty('type', node.type));
        }

        if (this.validPropertyNode(node.disabled)) {
            let editabled = !node.disabled ? true : false;
            uiElm.setProperty(new UIProperty('editabled', editabled));
        }

        // if (this.validPropertyNode(node.dataType)) {
        //     uiElm.setProperty(new UIProperty('dataType', node.dataType));
        // }

        if (this.validPropertyNode(node.value)) {
            uiElm.setProperty(new UIProperty('value', node.value));
        }

        if (this.validPropertyNode(node.minLength)) {
            if(node.minLength !== 0){
                uiElm.setProperty(new UIProperty('min_length', node.minLength));
            }
        }

        if (this.validPropertyNode(node.maxLength)) {
            if(node.maxLength !== 524288){
                uiElm.setProperty(new UIProperty('max_length', node.maxLength));
            }
        }

        if (this.validPropertyNode(node.min)) {
            uiElm.setProperty(new UIProperty('min_value', node.min));
        }

        if (this.validPropertyNode(node.max)) {
            uiElm.setProperty(new UIProperty('max_value', node.max));
        }

        if (this.validPropertyNode(node.pattern)) {
            uiElm.setProperty(new UIProperty('format', node.pattern));
        }

        return uiElm;
    }
}