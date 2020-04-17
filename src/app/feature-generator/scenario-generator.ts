import { VariantsGenerator } from "./variant-generator";
import { Scenario } from "../feature-structure/Scenario"

export class ScenarioGenerator {
    // node : any;
    // scenarios : Array <Scenario>;

    // constructor(node : any){
    //     this.node = node;
    //     this.scenarios = new Array; 
    // }

    // public getFormName(){
    //     return this.node.name
    // }

    // public getScenariosForm(){
    //     return this.scenarios;
    // }

    public generateScenarios(element : any) : Scenario{
        let scenario = new Scenario();

        for(let node of element){

            if(node.nodeName == "H1"){
                scenario.setName(node.innerText); 
            }
            
            if(node.nodeName == "DIV"){
                let variantsGenerator = new VariantsGenerator();
                let variants = variantsGenerator.generateVariants(node.children);
                scenario.setVariants(variants);
            }
        }

        return scenario;
    }
}