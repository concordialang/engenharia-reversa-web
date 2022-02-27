import { Graph } from '../graph/Graph';
import { InMemoryStorage } from './InMemoryStorage';

export class GraphStorage extends InMemoryStorage<Graph> {
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
