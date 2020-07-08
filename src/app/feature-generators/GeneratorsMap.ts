import { FeatureGenerator } from "./FeatureGenerator";
import { ScenarioGenerator } from "./ScenarioGenerator";
import { VariantsGenerator } from "./VariantsGenerator";
import { UIElementGenerator } from "./UIElementGenerator";
import { GeneratorTypes } from "./GeneratorTypes";

export class GeneratorsMap{
    private map: any;
    
    constructor(){
        this.map = new Map();
        this.map.set(GeneratorTypes.FEATURE, new FeatureGenerator());
        this.map.set(GeneratorTypes.SCENARIO, new ScenarioGenerator());
        this.map.set(GeneratorTypes.VARIANT, new VariantsGenerator());
        this.map.set(GeneratorTypes.UIELEMENT, new UIElementGenerator());
    }

    public getGeneratorsMap(){
        return this.map;
    } 
}