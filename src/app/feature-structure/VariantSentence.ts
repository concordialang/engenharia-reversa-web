import { VariantSentenceType } from "./VariantSentenceType";

export class VariantSentence {
    type: VariantSentenceType;
	action: string;
    targets: Array< string >;
    
    constructor(type: VariantSentenceType, action: string, targets: Array< string >) {
        this.type = type;
        this.action = action;
        this.targets = targets;
    }
}