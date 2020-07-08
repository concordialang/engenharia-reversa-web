import { Feature } from '../feature-structure/Feature';

export class Spec {
	public features: Array<Feature> = [];

	constructor(public readonly language: string) {}
}
