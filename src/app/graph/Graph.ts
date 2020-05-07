import Graph  from "graph-data-structure";

class GraphClass {
    
    private graphVendor : Graph;

    constructor(json? : object|string){
        this.graphVendor = new Graph();
        if(json){
            if(typeof json === 'string'){
                json = JSON.parse(json);
            }
            this.graphVendor = this.graphVendor.deserialize(json);
        }
    }

    public addNode(key : string) : void {
        this.graphVendor.addNode(key);
    }

    public addEdge(from : string, to : string) : void {
        this.graphVendor.addEdge(from,to);
    }

    public serialize() : object {
        return this.graphVendor.serialize();
    }

}

export {GraphClass as Graph};