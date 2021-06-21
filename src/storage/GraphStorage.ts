import { Graph } from '../graph/Graph';
import { LocalObjectStorage } from './LocalObjectStorage';

export class GraphStorage extends LocalObjectStorage<Graph> {
	protected stringifyObject(obj: Graph): string {
		const json: object = obj.serialize();
		return JSON.stringify(json);
	}

	protected mapJsonToObject(json: {}): Graph {
		if (json) {
			return new Graph(json);
		} else {
			return new Graph();
		}
	}
}
