import { Variant } from "../feature-structure/Variant";
import { VariantSentence } from "../feature-structure/VariantSentence";
import { VariantSentenceType } from "../feature-structure/types/VariantSentenceType";

export class VariantsGenerator {

    public generate(node : any) : Array <Variant>{

        let variants = [];

        for(let inode of node){

            let variant = new Variant();

            if(node.nodeName == 'INPUT'){
                
                if(typeof inode.id != undefined){
                    let variantName = inode.id.toString(); 
                    variant.setName(variantName.charAt(0).toUpperCase() + variantName.slice(1));
                    
                    variant.setVariantSentence(new VariantSentence(VariantSentenceType.WHEN, 'fill', ['<#' + inode.id + '>']));
                    variants.push(variant);
                }       
            }
        }

        return variants;
    }
}
