import { Type } from 'class-transformer';
import { Variant } from './Variant';

export class Scenario {
	@Type(() => Variant)
	private variants!: Array<Variant>;

	constructor(private name: string) {
		this.variants = [];
	}

	//name
	public setName(name: string) {
		this.name = name;
	}

	public getName(): string {
		return this.name;
	}

	public addVariant(variant: Variant) {
		const index = this.variants.findIndex((v) => v.getId() === variant.getId());
		if (index > -1) {
			this.variants[index] = variant;
		} else {
			this.variants.push(variant);
		}
	}

	public setVariants(variants: Array<Variant>) {
		this.variants = variants;
	}

	public getVariants() {
		return this.variants;
	}
}
