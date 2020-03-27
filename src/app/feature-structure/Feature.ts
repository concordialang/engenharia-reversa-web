import { Import } from "./Import";
import { Scenario } from "./Scenario";
import { UIElement } from "./UIElement";

export class Feature{
    name: string;
    imports: Array< Import >;
    scenarios: Array< Scenario >;
    uiElements: Array< UIElement >;

    constructor(){
        this.name = '';
        this.imports = [];
        this.scenarios = [];
        this.uiElements = [];
    }

    public setUiElement(uiElement : UIElement){
        this.uiElements.push(uiElement);
    }
}