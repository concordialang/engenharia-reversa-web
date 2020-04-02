import { Variant } from "./Variant";

export class Scenario {
	name!: string;
    variants!: Array< Variant >;
    
    // constructor(name: string, variants: Array< Variant >) {
    //     this.name = name;
    //     this.variants = variants;
    // }

    //name
    public setName(name : string){
        this.name = name;
    }

    public getName(){
        return this.name;
    }

    //variants
    public setVariant(variant : Variant){
        this.variants.push(variant);
    }

    public setVariants(variants : Array< Variant >){
        this.variants = variants;
    }

    public getVariants(){
        return this.variants;
    }
}