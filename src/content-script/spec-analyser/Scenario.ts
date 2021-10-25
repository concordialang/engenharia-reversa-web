import { Type } from 'class-transformer';
import { Variant } from './Variant';

export class Scenario {
	@Type(() => Variant)
	private variants!: Array<Variant>;

	constructor(private name: string, private maxVariantCount: number = 1) {
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
		this.variants.push(variant);
	}

	public setVariants(variants: Array<Variant>) {
		this.variants = variants;
	}

	public getVariants() {
		return this.variants;
	}

	public getVariantsCount() {
		return this.variants.length;
	}

	public getMaxVariantsCount() {
		return this.maxVariantCount;
	}

	public setMaxVariantCount(maxVariantCount: number) {
		if (Number.isInteger(maxVariantCount) && maxVariantCount > 0) {
			this.maxVariantCount = maxVariantCount;
		}
	}
}
