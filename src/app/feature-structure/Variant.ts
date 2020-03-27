import { VariantSentence } from "./VariantSentence";

export class Variant {
    sentences: Array< VariantSentence >;
    
    constructor(sentences: Array< VariantSentence >) {
        this.sentences = sentences;
    }
}