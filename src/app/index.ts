import { Feature } from "./feature-structure/Feature";
import { Input } from "./elements-handler/Input";
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
        let input = new Input(node);
        let obj = input.getUIElementInput();
        feature.setUiElement(obj);
    }
});
console.log(feature);