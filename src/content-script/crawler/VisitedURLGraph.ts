import { Graph } from '../graph/Graph';
import Mutex from '../mutex/Mutex';
import { GraphStorage } from '../storage/GraphStorage';

export class VisitedURLGraph {
	private visitedURLGraphKey: string;

	constructor(private graphStorage: GraphStorage, private mutex: Mutex) {
		this.mutex = mutex;
		this.visitedURLGraphKey = 'visited-url-graph';
	}

	public async addVisitedURLToGraph(url: URL, sourceURL: URL | null = null): Promise<void> {
		await this.mutex.lock();
		const graph = await this.getLatestVersionOfGraph();
		graph.addNode(url.toString());
		if (sourceURL) {
			graph.addEdge(sourceURL.toString(), url.toString());
		}
		this.graphStorage.set(this.visitedURLGraphKey, graph);
		await this.mutex.unlock();
	}

	private async getLatestVersionOfGraph(): Promise<Graph> {
		let graph: Graph | null = await this.graphStorage.get(this.visitedURLGraphKey);
		if (!graph) {
			graph = new Graph();
		}
		return graph;
	}
}
