import { IndexedDBDatabases } from "../../shared/storage/IndexedDBDatabases";
import { IndexedDBObjectStorage } from "../../shared/storage/IndexedDBObjectStorage";
import { ElementAnalysis } from "../extension/ElementAnalysis";
import { InMemoryDatabase } from "../extension/InMemoryDatabase";
import { InMemoryStorage } from "./InMemoryStorage";

// TODO Trocar o nome da classe
export class ElementAnalysisStorage extends IndexedDBObjectStorage<ElementAnalysis> {
	constructor(inMemoryDatabase: InMemoryDatabase) {
		super(
			IndexedDBDatabases.ElementAnalysis,
			IndexedDBDatabases.ElementAnalysis,
			ElementAnalysis
		);
	}
}
