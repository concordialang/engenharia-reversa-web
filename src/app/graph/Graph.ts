import Graph from 'graph-data-structure';

//tive que chamar de GraphClass porque por algum motivo dá erro se chamar somente de Graph
class GraphClass {
	private graphVendor: Graph;

	constructor(json?: object | string) {
		this.graphVendor = new Graph();
		if (json) {
			if (typeof json === 'string') {
				json = JSON.parse(json);
			}
			this.graphVendor = this.graphVendor.deserialize(json);
		}
	}

	public addNode(key: string): void {
		this.graphVendor.addNode(key);
	}

	public addEdge(from: string, to: string): void {
		const adjacentNodes: Array<string> = this.getAdjacentNodes(from);
		if (!adjacentNodes.includes(to)) {
			this.graphVendor.addEdge(from, to);
		}
	}

	public getAllNodes(): Array<string> {
		return this.graphVendor.nodes();
	}

	public getAdjacentNodes(key: string): Array<string> {
		return this.graphVendor.adjacent(key);
	}

	public serialize(): object {
		return this.graphVendor.serialize();
	}
}

export { GraphClass as Graph };
