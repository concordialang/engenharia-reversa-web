import { NodeTypes } from "../node/NodeTypes";
import { Variant } from "../feature-structure/Variant";
import { VariantSentence } from "../feature-structure/VariantSentence";
import { VariantSentenceType } from "../feature-structure/types/VariantSentenceType";
import { VariantSentenceActions } from "../feature-structure/types/VariantSentenceActions";
import { UIElement } from "../feature-structure/UIElement";
import { Util } from "../Util";
import { EditableTypes } from "../feature-structure/types/EditableTypes";

export class VariantsGenerator {

    // private checkValidNode(node: HTMLElement) : boolean{
    //     // return false if node is not treatable for variants
    //     if(node.nodeName != NodeTypes.INPUT && node.nodeName != NodeTypes.SELECT && node.nodeName != NodeTypes.TEXTAREA){
    //         return false;
    //     }

    //     return true;
    // }

    public generateVariantFromUIElements(uiElements: Array <UIElement>, onlyMandatoryElements: boolean = false): Variant {
        let variant = new Variant();
        
        for(let uiElm of uiElements){
            let type: string = '';
            let target: string | null = null;
            let editable: boolean | null = null;
            let required: boolean = false;

            for(let property of uiElm.getProperties()){
                switch(property.getName()){
                    case 'type' : type = property.getValue(); break;
                    case 'editabled' : editable = property.getValue(); break;
                    case 'id' : target = property.getValue(); break;
                    case 'required' : required = property.getValue(); break;
                }
            }

            // check required property based on parameter for mandatory elements
            if(onlyMandatoryElements){
                if(!required){
                    continue;
                }
            }

            if(target === null || editable === null || type === '' ){
                continue;
            }

            let action: string = "";
            switch(type){
                case EditableTypes.TEXTBOX: action = VariantSentenceActions.FILL; break;
                case EditableTypes.TEXTAREA: action = VariantSentenceActions.FILL; break;
                case EditableTypes.CHECKBOX: action = VariantSentenceActions.CHECK; break;
                case EditableTypes.SELECT: action = VariantSentenceActions.SELECT; break;
                default: action = VariantSentenceActions.FILL; break;
            }

            variant.setVariantSentence(new VariantSentence(VariantSentenceType.WHEN, action, ["{" + target + "}"]));
        }

        return variant;
    }


    // public generateVariantFromUIElements(form: HTMLElement, uiElements: Array <UIElement>): Variant {
    //     let variant = new Variant();
    //     let formElements : Array < HTMLFormElement > = Array.from(form.querySelectorAll('*'));
        
    //     for(let elm of formElements){
            
    //         if(!this.checkValidNode(elm)){
    //             continue;
    //         }

    //         if(typeof elm.id != undefined){
    //             let target = '<#' + elm.id + '>';
                
    //             for(let uiElm of uiElements){
    //                 for(let property of uiElm.getProperties()){
    //                     if(elm.id == property.getValue()){
    //                         target = "{" + uiElm.getName() + "}";
    //                     }
    //                 }
    //             }
                
    //             variant.setVariantSentence(new VariantSentence(VariantSentenceType.WHEN, VariantSentenceActions.FILL, [target]));
    //         }
    //     }

    //     return variant;
    // }
}
