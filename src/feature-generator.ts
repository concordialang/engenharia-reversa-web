import { ScenarioGenerator } from "./app/feature-generator/scenario-generator";
import { Feature } from "./app/feature-structure/feature";
import { UIElementGenerator } from "./app/feature-generator/uielement-generator";
//import { Feature } from "./app/feature-structure/Feature";

export class FeatureGenerator {

    feature!: Feature;
    
    constructor(){
        this.feature = new Feature();
    }

    fromElement( element: HTMLElement ): any {
        
        element.querySelectorAll('*').forEach((node) => {
            if(node.nodeName == "FORM"){
                let scenarioGenerator = new ScenarioGenerator();
                this.feature.setScenario(scenarioGenerator.generateScenarios(node.children));
            }
    
            if(node.nodeName == "INPUT"){
                let uiElementGenerator = new UIElementGenerator();
                this.feature.setUiElement(uiElementGenerator.generateUIElement(<HTMLInputElement>node));
            }
        });
        
        return this.feature;
    }

}