import { Graph } from "./Graph";

export class GraphStorage {

    public save(key : string, graph : Graph) : void{
        const json : object = graph.serialize();
        window.localStorage.setItem(key,JSON.stringify(json));
    }

    public get(key : string) : Graph {
        let json : string|object|null = window.localStorage.getItem(key);
        let graph : Graph;
        if(json){
            graph = new Graph(json);
        }
        else{
            graph = new Graph();
        }
        return graph;
    }

    public remove(key : string) : void {
        window.localStorage.removeItem(key);
    }
    
}