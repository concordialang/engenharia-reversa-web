import { Feature } from "./feature-structure/Feature";
import { UIElementGenerator } from "./elements-handler/uielement-generator.ts";
import { Form } from "./elements-handler/Form";

let feature = new Feature();
//var allElements = document.body.getElementsByTagName("*");
document.body.querySelectorAll('*').forEach(function(node) {
      
    if(node.nodeName == "FORM"){
        let form = new Form(node);
        feature.setName(form.getFormName());
        feature.scenarios = form.analyzeChildrenNodesForm();
    }

    if(node.nodeName == "INPUT"){
        let input = new UIElementGenerator();
        let obj = input.generateUIElement();
        feature.setUiElement(obj);
    }
});
console.log(feature);