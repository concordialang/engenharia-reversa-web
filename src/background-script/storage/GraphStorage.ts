import { Graph } from "../../content-script/graph/Graph";
import { InMemoryStorage } from "./InMemoryStorage";

export class GraphStorage extends InMemoryStorage<Graph> {

	public async set(key: string, obj: Graph): Promise<void> {
		await super.set(key, obj);
	}

	public async get(key: string): Promise<Graph | null> {
		let graph =  await super.get(key);
		if(typeof graph === "string") {
			graph = new Graph(JSON.parse(graph));
		}
		return graph;
	}

	protected serialize(obj: Graph): {} {
		const json: object = obj.serialize();
		return JSON.stringify(json);
	}

	protected deserialize(json: any): Graph {
		if (json) {
			return new Graph(json);
		} else {
			return new Graph();
		}
	}
}
