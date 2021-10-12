import { Type } from 'class-transformer';
import { Variant } from './Variant';

export class Scenario {
	private name!: string;

	@Type(() => Variant)
	private variants!: Array<Variant>;

	constructor() {
		this.variants = [];
	}

	//name
	public setName(name: string) {
		this.name = name;
	}

	public getName(): string {
		return this.name;
	}

	//variants
	public addVariant(variant: Variant) {
		this.variants.push(variant);
	}

	public setVariants(variants: Array<Variant>) {
		this.variants = variants;
	}

	public getVariants() {
		return this.variants;
	}
}
