import { Graph } from '../src/app/graph/Graph';

describe('Graph', () => {
	const url1: string = 'https://www.google.com';
	const url2: string = 'https://www.facebook.com';
	const url3: string = 'https://www.twitter.com';

	it('adds node', () => {
		const graph: Graph = new Graph();
		graph.addNode(url1);
		graph.addNode(url2);
		const nodes: Array<string> = graph.getAllNodes();
		expect(nodes.includes(url1)).toBe(true);
		expect(nodes.includes(url2)).toBe(true);
	});

	it('adds only one node at a time', () => {
		const graph: Graph = new Graph();
		graph.addNode(url1);
		let nodes: Array<string> = graph.getAllNodes();
		expect(nodes.length).toBe(1);
		graph.addNode(url2);
		nodes = graph.getAllNodes();
		expect(nodes.length).toBe(2);
	});

	it('doesnt add the same node more than once', () => {
		const graph: Graph = new Graph();
		graph.addNode(url1);
		graph.addNode(url1);
		const nodes: Array<string> = graph.getAllNodes();
		expect(nodes.includes(url1)).toBe(true);
		expect(nodes.length).toBe(1);
	});

	it('adds edge', () => {
		const graph: Graph = new Graph();
		graph.addEdge(url1, url2);
		graph.addEdge(url2, url1);
		const adjacentNodesUrl1: Array<string> = graph.getAdjacentNodes(url1);
		const adjacentNodesUrl2: Array<string> = graph.getAdjacentNodes(url2);
		expect(adjacentNodesUrl1.includes(url2)).toBe(true);
		expect(adjacentNodesUrl2.includes(url1)).toBe(true);
	});

	it('adds only one edge at a time', () => {
		const graph: Graph = new Graph();
		graph.addEdge(url1, url2);
		let adjacentNodes: Array<string> = graph.getAdjacentNodes(url1);
		expect(adjacentNodes.length).toBe(1);
		graph.addEdge(url1, url3);
		adjacentNodes = graph.getAdjacentNodes(url1);
		expect(adjacentNodes.length).toBe(2);
	});

	it('adding a edge will automatically add a new node', () => {
		const graph: Graph = new Graph();
		graph.addEdge(url1, url2);
		const adjacentNodes: Array<string> = graph.getAdjacentNodes(url1);
		expect(adjacentNodes.includes(url2)).toBe(true);
		expect(adjacentNodes.length).toBe(1);
		const nodes: Array<string> = graph.getAllNodes();
		expect(nodes.includes(url1)).toBe(true);
		expect(nodes.includes(url2)).toBe(true);
	});

	it('doesnt add the same edge more than once', () => {
		const graph: Graph = new Graph();
		graph.addEdge(url1, url2);
		graph.addEdge(url1, url2);
		const adjacentNodes: Array<string> = graph.getAdjacentNodes(url1);
		expect(adjacentNodes.includes(url2)).toBe(true);
		expect(adjacentNodes.length).toBe(1);
	});

	//refatorar nome do teste ou dividir em testes separados
	it('serializes correctly', () => {
		const graph: Graph = new Graph();
		graph.addEdge(url1, url2);
		graph.addEdge(url1, url3);
		graph.addEdge(url2, url3);
		graph.addEdge(url3, url1);
		const serializedGraph: object = graph.serialize();

		const nodes = serializedGraph['nodes'];
		expect(nodes.length).toBe(3);
		expect(nodes).toContainEqual({ id: url1 });
		expect(nodes).toContainEqual({ id: url2 });
		expect(nodes).toContainEqual({ id: url3 });

		const links = serializedGraph['links'];
		expect(links.length).toBe(4);
		expect(links).toContainEqual({ source: url1, target: url2, weight: 1 });
		expect(links).toContainEqual({ source: url1, target: url3, weight: 1 });
		expect(links).toContainEqual({ source: url2, target: url3, weight: 1 });
		expect(links).toContainEqual({ source: url3, target: url1, weight: 1 });
	});

	it('creates graph instance from json object', () => {
		const graph: Graph = new Graph();
		graph.addEdge(url1, url2);
		graph.addEdge(url1, url3);
		graph.addEdge(url2, url3);
		graph.addEdge(url3, url1);
		const serializedGraph: object = graph.serialize();

		const deserializedGraph: Graph = new Graph(serializedGraph);
		let nodes: Array<string> = deserializedGraph.getAllNodes();
		expect(nodes.includes(url1)).toBe(true);
		expect(nodes.includes(url2)).toBe(true);
		expect(nodes.includes(url3)).toBe(true);
		expect(nodes.length).toBe(3);

		expect(deserializedGraph.getAdjacentNodes(url1).includes(url2)).toBe(true);
		expect(deserializedGraph.getAdjacentNodes(url1).includes(url3)).toBe(true);
		expect(deserializedGraph.getAdjacentNodes(url2).includes(url3)).toBe(true);
		expect(deserializedGraph.getAdjacentNodes(url3).includes(url1)).toBe(true);
	});

	it('creates graph instance from json string', () => {
		const graph: Graph = new Graph();
		graph.addEdge(url1, url2);
		graph.addEdge(url1, url3);
		graph.addEdge(url2, url3);
		graph.addEdge(url3, url1);
		const serializedGraph: string = JSON.stringify(graph.serialize());

		const deserializedGraph: Graph = new Graph(serializedGraph);
		let nodes: Array<string> = deserializedGraph.getAllNodes();
		expect(nodes.includes(url1)).toBe(true);
		expect(nodes.includes(url2)).toBe(true);
		expect(nodes.includes(url3)).toBe(true);

		expect(deserializedGraph.getAdjacentNodes(url1).includes(url2)).toBe(true);
		expect(deserializedGraph.getAdjacentNodes(url1).includes(url3)).toBe(true);
		expect(deserializedGraph.getAdjacentNodes(url2).includes(url3)).toBe(true);
		expect(deserializedGraph.getAdjacentNodes(url3).includes(url1)).toBe(true);
	});
});
