import { Div } from "./Div";
import { Scenario } from "../feature-structure/Scenario"

export class Form {
    node : any;
    scenarios : Array <Scenario>;

    constructor(node : any){
        this.node = node;
        this.scenarios = new Array;

        //apagar
        let teste = [];
        teste.push(node)
        console.log(teste);  
    }

    public getFormName(){
        return this.node.name
    }

    public getScenariosForm(){
        return this.scenarios;
    }

    public analyzeChildrenNodesForm(){
        for(let node of this.node.children){
            
            if(node.nodeName == "DIV"){
                
                let scenario = new Scenario();
                if(node.firstElementChild.nodeName == "H1"){
                    scenario.setName(node.innerText); 
                }

                let div = new Div(node);
                let variants = div.analyzeChildrenNodesDiv();
                scenario.setVariants(variants);
                this.scenarios.push(scenario);
            }
        }

        return this.getScenariosForm();
    }
}