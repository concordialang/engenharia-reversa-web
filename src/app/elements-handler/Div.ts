import { Variant } from "../feature-structure/Variant";
import { VariantSentence } from "../feature-structure/VariantSentence";
import { VariantSentenceType } from "../feature-structure/VariantSentenceType";
import { Input } from "./Input";

export class Div {
    node : any;
    variants : Array <Variant>;

    constructor(node : any){
        this.node = node;
        this.variants = [];
    }

    public getVariantsDivs(){
        return this.variants;
    }

    public analyzeChildrenNodesDiv(){
        let variant = new Variant();

        if(this.node.nodeName == 'DIV'){
            
            variant.setName(this.node.name);

            for(let nodeDiv of this.node.children){

                if(nodeDiv.nodeName == 'DIV'){

                    for(let nodeDivInterna of nodeDiv.children){
                        if(nodeDivInterna.nodeName == 'INPUT'){
                            variant.setVariantSentence(new VariantSentence(VariantSentenceType.WHEN, 'fill', ['<#' + nodeDiv.id + '>']));
                        }
                    }
                    
                }
            }

            this.variants.push(variant);
        }

        return this.getVariantsDivs();
    }
}