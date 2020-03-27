import { Feature } from "./feature-structure/Feature";
import { Input } from "./elements-handler/Input";

let feature = new Feature();
//var allElements = document.body.getElementsByTagName("*");
document.querySelectorAll('*').forEach(function(node) {
    if(node.nodeName == "INPUT"){
        let input = new Input(node);
        let obj = input.getElementAnalized();
        feature.setUiElement(obj);
        console.log(feature);
    }
});
// console.log(feature);