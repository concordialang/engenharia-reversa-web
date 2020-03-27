import { Variant } from "./Variant";

export class Scenario {
	name: string;
    variants: Array< Variant >;
    
    constructor(name: string, variants: Array< Variant >) {
        this.name = name;
        this.variants = variants;
    }
}