import { UIElement } from "../feature-structure/UIElement";
import { UIProperty } from "../feature-structure/UIProperty";

export class Input {
    node : any;
    uiElm: UIElement;
    
    constructor( node : any ){
        this.node = node;
        this.uiElm = new UIElement();
    }

    private validPropertyNode(node : any){
        if(node === null || node === undefined || node === ''){
            return false
        }

        return true;
    }

    public getElementAnalized () : UIElement{

        if (this.validPropertyNode(this.node.name)) {
            this.uiElm.setName(this.node.name);
        }

        if (this.validPropertyNode(this.node.id)) {
            this.uiElm.setProperty(new UIProperty('id', this.node.id));
        }

        if (this.validPropertyNode(this.node.type)) {
            this.uiElm.setProperty(new UIProperty('type', this.node.type));
        }

        if (this.validPropertyNode(this.node.disabled)) {
            let editabled = !this.node.disabled ? true : false;
            this.uiElm.setProperty(new UIProperty('editabled', editabled));
        }

        // if (this.validPropertyNode(this.node.dataType)) {
        //     this.uiElm.setProperty(new UIProperty('dataType', this.node.dataType));
        // }

        if (this.validPropertyNode(this.node.value)) {
            this.uiElm.setProperty(new UIProperty('value', this.node.value));
        }

        if (this.validPropertyNode(this.node.minLength)) {
            this.uiElm.setProperty(new UIProperty('min_length', this.node.minLength));
        }

        if (this.validPropertyNode(this.node.maxLength)) {
            this.uiElm.setProperty(new UIProperty('max_length', this.node.maxLength));
        }

        if (this.validPropertyNode(this.node.min)) {
            this.uiElm.setProperty(new UIProperty('min_value', this.node.min));
        }

        if (this.validPropertyNode(this.node.max)) {
            this.uiElm.setProperty(new UIProperty('max_value', this.node.max));
        }

        if (this.validPropertyNode(this.node.pattern)) {
            this.uiElm.setProperty(new UIProperty('format', this.node.pattern));
        }

        return this.uiElm;
    }
}