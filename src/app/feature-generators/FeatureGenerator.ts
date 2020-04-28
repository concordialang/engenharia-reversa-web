import { ScenarioGenerator } from "./ScenarioGenerator";
import { Feature } from "../feature-structure/Feature";
import { UIElementGenerator } from "./UIElementGenerator";
import { NodeIterator } from "../node/NodeIterator";
import { NodeTypes } from "../node/NodeTypes";
import { VariantsGenerator } from "./VariantsGenerator";
import { ContextGenerator } from "./ContextGenerator";

export class FeatureGenerator {

    private _generatorMap: any;
    
    constructor(){
        this._generatorMap = {};
        this._generatorMap[ 'default' ] = new ScenarioGenerator();
        this._generatorMap[ NodeTypes.FORM ] = new ScenarioGenerator();
        this._generatorMap[ NodeTypes.DIV ] = new VariantsGenerator();
        this._generatorMap[ NodeTypes.INPUT ] = new UIElementGenerator();
    }

    fromElement( body: HTMLElement ): Feature {
        // element.querySelectorAll('*').forEach((node) => {
        //     if(node.nodeName == "FORM"){
        //         let scenarioGenerator = new ScenarioGenerator();
        //         this.feature.setScenario(scenarioGenerator.generateScenarios(node.children));
        //     }
    
        //     if(node.nodeName == "INPUT"){
        //         let uiElementGenerator = new UIElementGenerator();
        //         this.feature.setUiElement(uiElementGenerator.generateUIElement(<HTMLInputElement>node));
        //     }
        // });

        let feature = new Feature();
        let nodes = Array.from( body.children );
        let it = new NodeIterator( nodes );
        let node = null;
        let nodeParser = null
        let context: ContextGenerator = new ContextGenerator( feature );

        while ( it.hasNext() ) {
            node = it.next();

            nodeParser = node?.nodeName != undefined ? this._generatorMap[ node.nodeName] : this._generatorMap[ "default" ];

            feature = nodeParser.generate(node, feature);
        }

        return feature;
    }

}