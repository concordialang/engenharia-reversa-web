import cytoscape, { CytoscapeOptions, ElementDefinition } from 'cytoscape';

export class Graph {
	private graph: cytoscape.Core;

	constructor(json?: object | string) {
		this.graph = cytoscape();
		if (json) {
			this.graph = cytoscape(this.deserialize(json));
		} else {
			this.graph = cytoscape();
		}
	}

	public addNode(key: string): void {
		if (!this.nodeExists(key)) {
			this.graph.add({ group: 'nodes', data: { id: key } });
		}
	}

	public addEdge(from: string, to: string): void {
		const adjacentNodes: Array<string> = this.getAdjacentNodes(from);
		if (!adjacentNodes.includes(to)) {
			this.graph.add({ group: 'edges', data: { source: from, target: to } });
		}
	}

	public getAllNodes(): Array<string> {
		const nodes = this.graph.nodes();
		const nodesIds: string[] = [];
		nodes.each(function (node) {
			nodesIds.push(node.data('id'));
		});
		return nodesIds;
	}

	public getAdjacentNodes(key: string): Array<string> {
		const nodesIds: string[] = [];
		const nodes = this.graph.elements(`edge[source = "${key}"]`);
		nodes.each(function (node) {
			nodesIds.push(node.data('target'));
		});
		return nodesIds;
	}

	//FIXME Remover essa função após refatoração
	public depthFirstSearch(): Array<string> {
		const nodesIds: string[] = [];
		const nodes = this.graph.nodes();
		if (nodes.length > 0) {
			nodes.dfs({ root: 'node' }).path.each(function (node) {
				nodesIds.push(node.data('id'));
			});
		}
		return nodesIds.reverse();
	}

	public nodeExists(key: string): boolean {
		const matches = this.graph.elements('node#' + key);
		if (matches.length > 0) {
			return true;
		}
		return false;
	}

	public getParentNodeKey(key: string): string | null {
		const edge = this.graph.elements(`edge[target = "${key}"]`);
		if (edge) {
			const source = edge.data('source');
			if (source) {
				return source;
			}
		}
		return null;
	}

	public getChildNodeKey(key: string): string | null {
		const edge = this.graph.elements(`edge[source = "${key}"]`);
		if (edge) {
			const source = edge.data('target');
			if (source) {
				return source;
			}
		}
		return null;
	}

	public serialize(): object {
		const nodes: { id: string }[] = [];
		const edges: { source: string; target: string }[] = [];

		this.graph.nodes().each((node) => {
			nodes.push({ id: node.data('id') });
		});

		this.graph.edges().each((edge) => {
			edges.push({ source: edge.data('source'), target: edge.data('target') });
		});

		return { links: edges, nodes: nodes };
	}

	private deserialize(json: object | string): CytoscapeOptions {
		if (typeof json === 'string') {
			json = JSON.parse(json);
		}

		const jsonEdges = json['links'];
		const jsonNodes = json['nodes'];
		if (Array.isArray(jsonEdges) && Array.isArray(jsonNodes)) {
			const elements: ElementDefinition[] = [];

			for (let jsonEdge of jsonEdges) {
				const edge = { data: { source: jsonEdge.source, target: jsonEdge.target } };
				elements.push(edge);
			}
			for (let jsonNode of jsonNodes) {
				const node = { data: { id: jsonNode.id } };
				elements.push(node);
			}

			return { elements: elements };
		} else {
			throw new Error('Malformed Graph JSON');
		}
	}
}
