import GraphType from 'graph-data-structure';

export class Graph {
	private _graph: ReturnType<typeof GraphType>;

	constructor(json?: object | string) {
		this._graph = GraphType();
		if (json) {
			if (typeof json === 'string') {
				json = JSON.parse(json);
			}
			this._graph = this._graph.deserialize(json as any);
		}
	}

	public addNode(key: string): void {
		this._graph.addNode(key);
	}

	public addEdge(from: string, to: string): void {
		const adjacentNodes: Array<string> = this.getAdjacentNodes(from);
		if (!adjacentNodes.includes(to)) {
			this._graph.addEdge(from, to);
		}
	}

	public getAllNodes(): Array<string> {
		return this._graph.nodes();
	}

	public getAdjacentNodes(key: string): Array<string> {
		return this._graph.adjacent(key);
	}

	public serialize(): object {
		return this._graph.serialize();
	}
}
