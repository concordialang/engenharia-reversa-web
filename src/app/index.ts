import { Feature } from "./feature-structure/feature";
import { UIElementGenerator } from "./feature-generator/uielement-generator";
import { ScenarioGenerator } from "./feature-generator/scenario-generator";

let feature = new Feature();
//var allElements = document.body.getElementsByTagName("*");
document.body.querySelectorAll('*').forEach(function(node) {
      
    if(node.nodeName == "FORM"){
        let form = new ScenarioGenerator(node);
        feature.setName(form.getFormName());
        feature.scenarios = form.generateScenarios(<HTMLFormElement>node);
    }

    if(node.nodeName == "INPUT"){
        let input = new UIElementGenerator();
        let obj = input.generateUIElement(<HTMLInputElement>node);
        feature.setUiElement(obj);
    }
});
console.log(feature);