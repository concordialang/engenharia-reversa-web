import { VariantsGenerator } from "./variant-generator";
import { Scenario } from "../feature-structure/Scenario"

export class ScenarioGenerator {
    node : any;
    scenarios : Array <Scenario>;

    constructor(node : any){
        this.node = node;
        this.scenarios = new Array; 
    }

    public getFormName(){
        return this.node.name
    }

    public getScenariosForm(){
        return this.scenarios;
    }

    public generateScenarios(node : HTMLDivElement){
        for(let node of this.node.children){
            
            if(node.nodeName == "DIV"){
                
                let scenario = new Scenario();
                if(node.firstElementChild.nodeName == "H1"){
                    scenario.setName(node.innerText); 
                }

                let div = new VariantsGenerator(node);
                let variants = div.generateVariants(<HTMLDivElement>node);
                scenario.setVariants(variants);
                this.scenarios.push(scenario);
            }
        }

        return this.getScenariosForm();
    }
}