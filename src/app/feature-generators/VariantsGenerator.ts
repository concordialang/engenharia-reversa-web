import { NodeTypes } from "../node/NodeTypes";
import { Variant } from "../feature-structure/Variant";
import { VariantSentence } from "../feature-structure/VariantSentence";
import { VariantSentenceType } from "../feature-structure/types/VariantSentenceType";
import { VariantSentenceActions } from "../feature-structure/types/VariantSentenceActions";
import { UIElement } from "../feature-structure/UIElement";
import { Util } from "../Util";

export class VariantsGenerator {

    private checkValidNode(node: HTMLElement) : boolean{
        // return false if node is not treatable for variants
        if(node.nodeName != NodeTypes.INPUT && node.nodeName != NodeTypes.SELECT && node.nodeName != NodeTypes.TEXTAREA){
            return false;
        }

        return true;
    }

    public generateVariantFromUIElements(form: HTMLElement, uiElements: Array <UIElement>): Variant {
        let variant = new Variant();
        let formElements : Array < HTMLFormElement > = Array.from(form.querySelectorAll('*'));
        
        for(let elm of formElements){
            
            if(!this.checkValidNode(elm)){
                continue;
            }

            if(typeof elm.id != undefined){
                let target = '<#' + elm.id + '>';
                
                for(let uiElm of uiElements){
                    for(let property of uiElm.getProperties()){
                        if(elm.id == property.getValue()){
                            target = "{" + uiElm.getName() + "}";
                        }
                    }
                }
                
                variant.setVariantSentence(new VariantSentence(VariantSentenceType.WHEN, VariantSentenceActions.FILL, [target]));
            }
        }

        return variant;
    }

    // public generateVariantFromUIElements(node : HTMLElement, uiElements : Array <UIElement>) : Variant {
    //     let variant = new Variant();
    //     let inputs : Array < HTMLInputElement > = Array.from(node.querySelectorAll(NodeTypes.INPUT));
        
    //     for(let input of inputs){
    //         if (input.nodeName == NodeTypes.INPUT){
    //             if(typeof node.id != undefined){
    //                 let target = '<#' + input.id + '>';
                    
    //                 for(let uiElm of uiElements){
    //                     for(let property of uiElm.getProperties()){
    //                         if(input.id == property.getValue()){
    //                             target = "{" + uiElm.getName() + "}";
    //                         }
    //                     }
    //                 }
                    
    //                 variant.setVariantSentence(new VariantSentence(VariantSentenceType.WHEN, 'fill', [target]));
    //             }
    //         }
    //     }

    //     return variant;
    // }

    public generateVariantFromMandatoryUIElements(node : HTMLElement, uiElements : Array <UIElement>) : Variant {
        let variant = new Variant();
        let inputs : Array < HTMLInputElement > = Array.from(node.querySelectorAll(NodeTypes.INPUT));
        
        for(let input of inputs){
            if (input.nodeName == NodeTypes.INPUT){
                if(input.required){
                    if(typeof node.id != undefined){
                        let target = '<#' + input.id + '>';
                        
                        for(let uiElm of uiElements){
                            for(let property of uiElm.getProperties()){
                                if(input.id == property.getValue()){
                                    target = "{" + uiElm.getName() + "}";
                                }
                            }
                        }
    
                        variant.setVariantSentence(new VariantSentence(VariantSentenceType.WHEN, 'fill', [target]));
                    }

                }
                
            }
        }

        return variant;
    }
}
