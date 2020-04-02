import { VariantSentence } from "./VariantSentence";

export class Variant {
    private name!: string;
    private sentences !: Array< VariantSentence >;
    
    constructor() {
        this.sentences = [];
    }

    public setName(nome : string){
        this.name = name;
    }

    public getName(){
        return this.name;
    }

    public setVariantSentence(variantSentence : VariantSentence){
        this.sentences.push(variantSentence);
    }

    public getVariant(){
        return this.sentences;
    }
}