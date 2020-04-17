import { Variant } from "../feature-structure/Variant";
import { VariantSentence } from "../feature-structure/VariantSentence";
import { VariantSentenceType } from "../feature-structure/VariantSentenceType";
import { UIElementGenerator } from "./uielement-generator";

export class VariantsGenerator {

    public generateVariants(element : any) : Array <Variant>{

        let variants = [];

        for(let node of element){

            let variant = new Variant();

            if(node.nodeName == 'INPUT'){
                
                if(typeof node.id != undefined){
                    let variantName = node.id.toString(); 
                    variant.setName(variantName.charAt(0).toUpperCase() + variantName.slice(1));
                    
                    variant.setVariantSentence(new VariantSentence(VariantSentenceType.WHEN, 'fill', ['<#' + node.id + '>']));
                    variants.push(variant);
                }       
            }
        }

        return variants;
    }
}
