import { ElementAnalysis } from "../extension/ElementAnalysis";
import { InMemoryDatabase } from "../extension/InMemoryDatabase";
import { InMemoryStorage } from "./InMemoryStorage";

// TODO Trocar o nome da classe
export class ElementAnalysisStorage extends InMemoryStorage<ElementAnalysis> {
	constructor(inMemoryDatabase: InMemoryDatabase) {
		super(inMemoryDatabase);
	}
}
