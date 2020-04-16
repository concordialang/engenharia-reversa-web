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
                let form = new ScenarioGenerator(node);
                this.feature.setName(form.getFormName());
                this.feature.scenarios = form.generateScenarios(<HTMLDivElement>node);
            }
    
            if(node.nodeName == "INPUT"){
                let uiElement = new UIElementGenerator();
                this.feature.setUiElement(uiElement.generateUIElement(<HTMLInputElement>node));
            }
        });
        
        return this.feature;
    }

}