import { Graph } from '../src/content-script/graph/Graph';

describe('Graph', () => {
	const key1: string = 'key1';
	const key2: string = 'key2';
	const key3: string = 'key3';

	it('returns that existent node exists', () => {
		const graph: Graph = new Graph();
		const key = 'test';
		graph.addNode(key);
		expect(graph.nodeExists(key)).toBe(true);
	});

	it("returns that non-existent node doesn't exist", () => {
		const graph: Graph = new Graph();
		const key = 'test';
		graph.addNode(key);
		expect(graph.nodeExists('test2')).toBe(false);
	});

	it('adds node', () => {
		const graph: Graph = new Graph();
		graph.addNode(key1);
		graph.addNode(key2);
		const nodes: Array<string> = graph.getAllNodes();
		expect(nodes.includes(key1)).toBe(true);
		expect(nodes.includes(key2)).toBe(true);
	});

	it('adds only one node at a time', () => {
		const graph: Graph = new Graph();
		graph.addNode(key1);
		let nodes: Array<string> = graph.getAllNodes();
		expect(nodes.length).toBe(1);
		graph.addNode(key2);
		nodes = graph.getAllNodes();
		expect(nodes.length).toBe(2);
	});

	it('doesnt add the same node more than once', () => {
		const graph: Graph = new Graph();
		graph.addNode(key1);
		graph.addNode(key1);
		const nodes: Array<string> = graph.getAllNodes();
		expect(nodes.includes(key1)).toBe(true);
		expect(nodes.length).toBe(1);
	});

	it('adds edge', () => {
		const graph: Graph = new Graph();
		graph.addNode(key1);
		graph.addNode(key2);
		graph.addEdge(key1, key2);
		graph.addEdge(key2, key1);
		const adjacentNodesUrl1: Array<string> = graph.getAdjacentNodes(key1);
		const adjacentNodesUrl2: Array<string> = graph.getAdjacentNodes(key2);
		expect(adjacentNodesUrl1.includes(key2)).toBe(true);
		expect(adjacentNodesUrl2.includes(key1)).toBe(true);
	});

	it('adds only one edge at a time', () => {
		const graph: Graph = new Graph();
		graph.addNode(key1);
		graph.addNode(key2);
		graph.addNode(key3);
		graph.addEdge(key1, key2);
		let adjacentNodes: Array<string> = graph.getAdjacentNodes(key1);
		expect(adjacentNodes.length).toBe(1);
		graph.addEdge(key1, key3);
		adjacentNodes = graph.getAdjacentNodes(key1);
		expect(adjacentNodes.length).toBe(2);
	});

	it('adding a edge will automatically add a new node', () => {
		const graph: Graph = new Graph();
		graph.addNode(key1);
		graph.addNode(key2);
		graph.addEdge(key1, key2);
		const adjacentNodes: Array<string> = graph.getAdjacentNodes(key1);
		expect(adjacentNodes.includes(key2)).toBe(true);
		expect(adjacentNodes.length).toBe(1);
		const nodes: Array<string> = graph.getAllNodes();
		expect(nodes.includes(key1)).toBe(true);
		expect(nodes.includes(key2)).toBe(true);
	});

	it('doesnt add the same edge more than once', () => {
		const graph: Graph = new Graph();
		graph.addNode(key1);
		graph.addNode(key2);
		graph.addEdge(key1, key2);
		graph.addEdge(key1, key2);
		const adjacentNodes: Array<string> = graph.getAdjacentNodes(key1);
		expect(adjacentNodes.includes(key2)).toBe(true);
		expect(adjacentNodes.length).toBe(1);
	});

	//refatorar nome do teste ou dividir em testes separados
	it('serializes correctly', () => {
		const graph: Graph = new Graph();

		graph.addNode(key1);
		graph.addNode(key2);
		graph.addNode(key3);
		graph.addEdge(key1, key2);
		graph.addEdge(key1, key3);
		graph.addEdge(key2, key3);
		graph.addEdge(key3, key1);
		const serializedGraph: object = graph.serialize();

		const nodes = serializedGraph['nodes'];
		expect(nodes.length).toBe(3);
		expect(nodes).toContainEqual({ id: key1 });
		expect(nodes).toContainEqual({ id: key2 });
		expect(nodes).toContainEqual({ id: key3 });

		const links = serializedGraph['links'];
		expect(links.length).toBe(4);
		expect(links).toContainEqual({ source: key1, target: key2 });
		expect(links).toContainEqual({ source: key1, target: key3 });
		expect(links).toContainEqual({ source: key2, target: key3 });
		expect(links).toContainEqual({ source: key3, target: key1 });
	});

	it('creates graph instance from json object', () => {
		const graph: Graph = new Graph();
		graph.addNode(key1);
		graph.addNode(key2);
		graph.addNode(key3);
		graph.addEdge(key1, key2);
		graph.addEdge(key1, key3);
		graph.addEdge(key2, key3);
		graph.addEdge(key3, key1);
		const serializedGraph: object = graph.serialize();

		const deserializedGraph: Graph = new Graph(serializedGraph);
		let nodes: Array<string> = deserializedGraph.getAllNodes();
		expect(nodes.includes(key1)).toBe(true);
		expect(nodes.includes(key2)).toBe(true);
		expect(nodes.includes(key3)).toBe(true);
		expect(nodes.length).toBe(3);

		expect(deserializedGraph.getAdjacentNodes(key1).includes(key2)).toBe(true);
		expect(deserializedGraph.getAdjacentNodes(key1).includes(key3)).toBe(true);
		expect(deserializedGraph.getAdjacentNodes(key2).includes(key3)).toBe(true);
		expect(deserializedGraph.getAdjacentNodes(key3).includes(key1)).toBe(true);
	});

	it('creates graph instance from json string', () => {
		const graph: Graph = new Graph();
		graph.addNode(key1);
		graph.addNode(key2);
		graph.addNode(key3);
		graph.addEdge(key1, key2);
		graph.addEdge(key1, key3);
		graph.addEdge(key2, key3);
		graph.addEdge(key3, key1);
		const serializedGraph: string = JSON.stringify(graph.serialize());

		const deserializedGraph: Graph = new Graph(serializedGraph);
		let nodes: Array<string> = deserializedGraph.getAllNodes();
		expect(nodes.includes(key1)).toBe(true);
		expect(nodes.includes(key2)).toBe(true);
		expect(nodes.includes(key3)).toBe(true);

		expect(deserializedGraph.getAdjacentNodes(key1).includes(key2)).toBe(true);
		expect(deserializedGraph.getAdjacentNodes(key1).includes(key3)).toBe(true);
		expect(deserializedGraph.getAdjacentNodes(key2).includes(key3)).toBe(true);
		expect(deserializedGraph.getAdjacentNodes(key3).includes(key1)).toBe(true);
	});
});
