import { Feature } from "../feature-structure/Feature";
import { NodeTypes } from "../node/NodeTypes";
import { NodeIterator } from "../node/NodeIterator";
import { GeneratorTypes } from "./GeneratorTypes";
import { GeneratorsMap } from "./GeneratorsMap";
import { ContextGenerator } from "./ContextGenerator";
import { Variant } from "../feature-structure/Variant";
import { VariantSentence } from "../feature-structure/VariantSentence";
import { VariantSentenceType } from "../feature-structure/types/VariantSentenceType";

export class VariantsGenerator {

    private elementsMap: any;
    
    private _createFeatureElementsMap(generatorsMap : any) : void {
        this.elementsMap = new Map();
        this.elementsMap.set(NodeTypes.INPUT, generatorsMap.get(GeneratorTypes.UIELEMENT));
    }

    private _contextualizes(context : ContextGenerator, variant: Variant) : ContextGenerator {
        context.inVariant = true;
        context.currentVariant = variant;

        return context;
    }

    // check if element is treatable for this class
    public _checkElementType(nodeName : String) : boolean{
        
        if(nodeName != NodeTypes.INPUT){
            return false;
        }

        return true;
    }

    public generate(element : HTMLElement, feature : Feature, generatorsMap : GeneratorsMap, context : ContextGenerator) : void {

        this._createFeatureElementsMap(generatorsMap);

        let nodes = Array.from( element.children );
        let it = new NodeIterator( nodes );
        let node : any = null;

        while ( it.hasNext() ) {
            node = it.next();

            if(node.nodeName == NodeTypes.INPUT){

                let variant = new Variant();
                context = this._contextualizes(context, variant);
                // variant.setName(node.innerHTML);

                if(typeof node.id != undefined){
                    let variantName = node.id.toString(); 
                    variant.setName(variantName.charAt(0).toUpperCase() + variantName.slice(1));
                    
                    variant.setVariantSentence(new VariantSentence(VariantSentenceType.WHEN, 'fill', ['<#' + node.id + '>']));
                    context.currentScenario.setVariant(variant);
                }
            }
        }
    }
}
