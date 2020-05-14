import { Scenario } from "../feature-structure/Scenario"
import { Feature } from "../feature-structure/Feature";
import { NodeTypes } from "../node/NodeTypes";
import { NodeIterator } from "../node/NodeIterator";
import { GeneratorTypes } from "./GeneratorTypes";
import { GeneratorsMap } from "./GeneratorsMap";
import { ContextGenerator } from "./ContextGenerator";

export class ScenarioGenerator {

    private elementsMap: any;
    
    private _createFeatureElementsMap(generatorsMap : any) : void {
        this.elementsMap = new Map();
        this.elementsMap.set(NodeTypes.DIV, generatorsMap.get(GeneratorTypes.VARIANT));
    }

    private _contextualizes(context : ContextGenerator, scenario : Scenario) : ContextGenerator {
        context.inScenario = true;
        context.currentScenario = scenario;

        return context;
    }

    // check if element is treatable for this class
    public _checkElementType(nodeName : String) : boolean{
        
        if(nodeName != NodeTypes.DIV){
            return false;
        }

        return true;
    }

    public generate(element : HTMLElement, feature : Feature, generatorsMap : GeneratorsMap, context : ContextGenerator) : void {
        
        this._createFeatureElementsMap(generatorsMap);

        let nodes = Array.from( element.children );
        let it = new NodeIterator( nodes );
        let node : any = null;
        let nodeGenerator = null

        while ( it.hasNext() ) {
            node = it.next();

            let scenario = new Scenario();
            context = this._contextualizes(context, scenario);

            if(node.nodeName == NodeTypes.H1 && context.inScenario && !context.inVariant){
                scenario.setName(node.innerHTML);
            }

            if(this._checkElementType(node.nodeName)){
                feature.addScenario( scenario );
                nodeGenerator = this.elementsMap.get(node.nodeName);
                nodeGenerator.generate(node, feature, generatorsMap, context)
            }
        }
    }
}