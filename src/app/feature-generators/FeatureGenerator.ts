import { ScenarioGenerator } from "./ScenarioGenerator";
import { VariantsGenerator } from "./VariantsGenerator";
import { UIElementGenerator } from "./UIElementGenerator";
import { Feature } from "../feature-structure/Feature";
import { NodeIterator } from "../node/NodeIterator";
import { NodeTypes } from "../node/NodeTypes";
import { ContextGenerator } from "./ContextGenerator";
import { GeneratorTypes } from "./GeneratorTypes";
// import { GeneratorsMap } from "./GeneratorsMap";

export class FeatureGenerator {

    private elementsMap: any;

    private _createGeneratorsMap(){
        let generatorsMap = new Map();
        generatorsMap.set(GeneratorTypes.FEATURE, new FeatureGenerator());
        generatorsMap.set(GeneratorTypes.SCENARIO, new ScenarioGenerator());
        generatorsMap.set(GeneratorTypes.VARIANT, new VariantsGenerator());
        generatorsMap.set(GeneratorTypes.UIELEMENT, new UIElementGenerator());

        return generatorsMap;
    }

    private _createFeatureElementsMap(generatorsMap : any) : void {
        this.elementsMap = new Map();
        this.elementsMap.set(NodeTypes.FORM, generatorsMap.get(GeneratorTypes.SCENARIO));
        this.elementsMap.set(NodeTypes.INPUT, generatorsMap.get(GeneratorTypes.UIELEMENT));
    }

    private _contextualizes(context : ContextGenerator, feature : Feature) : ContextGenerator {
        context.inFeature = true;
        context.currentFeature = feature;

        return context;
    }

    // check if element is treatable for this class
    public _checkElementType(nodeName : String) : boolean{
        
        if(nodeName != NodeTypes.FORM && nodeName != NodeTypes.INPUT){
            return false;
        }

        return true;
    }

    fromElement( body: HTMLElement ): Feature {
        let feature : Feature = new Feature();
        let context: ContextGenerator = new ContextGenerator( feature );
        context = this._contextualizes(context, feature);

        let all = body.querySelectorAll("*");
        let nodes = Array.from( all );
        let it = new NodeIterator( nodes );
        let node : any = null;
        let nodeGenerator = null
        
        let generatorsMap = this._createGeneratorsMap();
        this._createFeatureElementsMap(generatorsMap);

        while ( it.hasNext() ) {
            node = it.next();

            if(node.nodeName == NodeTypes.FORM && typeof node.id != undefined){
                let featureName = node.id.toString(); 
                feature.setName(featureName.charAt(0).toUpperCase() + featureName.slice(1));
            }

            nodeGenerator = this.elementsMap.get(node.nodeName);

            if(this._checkElementType(node.nodeName)){
                nodeGenerator.generate(node, feature, generatorsMap, context);
            }
        }

        return feature;
    }

}