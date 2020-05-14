import { Feature } from "../feature-structure/Feature";
import { NodeTypes } from "../node/NodeTypes";
import { Variant } from "../feature-structure/Variant";
import { VariantSentence } from "../feature-structure/VariantSentence";
import { VariantSentenceType } from "../feature-structure/types/VariantSentenceType";
import { UIElement } from "../feature-structure/UIElement";

export class VariantsGenerator {

    public generateVariantFromUIElements(node : HTMLElement, uiElements : Array <UIElement>) : Variant {
        let variant = new Variant();
        let inputs : Array < HTMLInputElement > = Array.from(node.querySelectorAll(NodeTypes.INPUT));
        
        for(let input of inputs){
            if (input.nodeName == NodeTypes.INPUT){
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

        return variant;
    }

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
