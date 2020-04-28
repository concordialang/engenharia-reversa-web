import { VariantsGenerator } from "./VariantsGenerator";
import { Scenario } from "../feature-structure/Scenario"
import { Feature } from "../feature-structure/Feature";
import { NodeTypes } from "../node/NodeTypes";
import { NodeIterator } from "../node/NodeIterator";


export class ScenarioGenerator {

    private _generatorMap: any;
    
    constructor(){
        this._generatorMap = {};
        this._generatorMap[ 'default' ] = new VariantsGenerator();
        this._generatorMap[ NodeTypes.DIV ] = new VariantsGenerator();
    }

    public generate(element : HTMLElement, feature : Feature) : Feature{
        let scenario = new Scenario();

        let nodes = Array.from( element.children );
        let it = new NodeIterator( nodes );
        let node = null;
        let nodeParser = null

        while ( it.hasNext() ) {
            node = it.next();

            nodeParser = node?.nodeName != undefined ? this._generatorMap[ node.nodeName] : this._generatorMap[ "default" ];

            let teste = '';
            feature.scenarios = nodeParser.generate(node, feature);
        }

        // for(let inode of node){

        //     if(inode.nodeName == "H1"){
        //         scenario.setName(inode.innerText); 
        //     }
            
        //     if(inode.nodeName == "DIV"){
        //         let variantsGenerator = new VariantsGenerator();
        //         let variants = variantsGenerator.generate(inode.children);
        //         scenario.setVariants(variants);
        //     }
        // }

        return feature;
    }
}