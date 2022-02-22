import { AppEvent } from "../../shared/comm/AppEvent";
import { Command } from "../../shared/comm/Command";
import { CommunicationChannel } from "../../shared/comm/CommunicationChannel";
import { Message } from "../../shared/comm/Message";
import { ElementInteraction } from "../crawler/ElementInteraction";
import { ElementInteractionStorage } from "../storage/ElementInteractionStorage";

export class GraphRenderer {

    public constructor(
        private communicationChannel: CommunicationChannel,
        private elementInteractionStorage: ElementInteractionStorage
    ){}

    public async render(): Promise<void> {
        const graphs = await this.getGraphs();
        await this.renderGraphs(graphs);
        this.communicationChannel.setMessageListener(async function (message: Message) {
            if (message.includesAction(AppEvent.InteractionGraphUpdated)) {
                window.location.reload();
            }
        });
    }

    private getGraphs() : Promise<Map<string, any>> {

        const message = new Message([Command.GetInteractionsGraphs]);
        const graphs = new Map();

        return new Promise((resolve, reject) => {
            this.communicationChannel.sendMessage(message).then(response => {
                const responseGraphs = response.getExtra();
                for (var key in responseGraphs) {
                    if (responseGraphs.hasOwnProperty(key)) {
                        graphs.set(key, responseGraphs[key]);
                    }
                }
                resolve(graphs);
            });
        });

    }

    private async getInteractions(graphs): Promise<Map<string, ElementInteraction<HTMLElement>>> {
        const interactions = new Map<string, ElementInteraction<HTMLElement>>();
        for(let graph of graphs.values()){
            if(graph.nodes){
                for(let node of graph.nodes){
                    const interaction = await this.elementInteractionStorage.get(node.id);
                    if(interaction){
                        interactions.set(node.id, interaction);
                    }
                }
            }
        }
        return interactions;
    }

    private async renderGraphs(graphs){

        const interactions = await this.getInteractions(graphs);
        const pages = [];

        const _this = this;
        const keys = graphs.keys();
        const links = [];
        const nodes = [];

        for(let graph of graphs.values()){
            if(graph.links){
                for(let link of graph.links){
                    //@ts-ignore
                    links.push(link);
                }
            }
        }

        for(let graph of graphs.values()){
            if(graph.nodes){
                for(let node of graph.nodes){
                    //@ts-ignore
                    nodes.push(node);
                }
            }
        }

        window.addEventListener('storage', function(e) {
            for(let key of keys){
                if(e.key == key){
                    window.location.reload();
                }
            }
        });

        const interactionsGraph = {
            links : links,
            nodes : nodes
        }

        const mappedNodes = interactionsGraph.nodes.map(function(node){
            //@ts-ignore
            return {data:{id:node.id}};
        });
        const mappedEdges = interactionsGraph.links.map(function(edge){
            return {data:edge};
        });

        //@ts-ignore
        var cy = window.cy = cytoscape({
            container: document.getElementById('cy'),

            boxSelectionEnabled: false,
            autounselectify: true,

            layout: {
            name: 'dagre'
            },

            style: [
            {
                selector: 'node',
                style: {
                'content': function (ele) {
                    const id = ele.data('id');
                    const interaction = interactions.get(id);
                    let text = "";
                    text += id;
                    //@ts-ignore
                    text += " , "+interaction.getElementSelector();
                    //@ts-ignore
                    text += " , "+interaction.getEventType();
                    //@ts-ignore
                    if(interaction.getValue()) text += ' , "'+interaction.getValue()+'"';
                    return text;
                },
                "font-size" : "8px",
                "text-valign" : "bottom",
                'background-color': function (ele) {
                    const id = ele.data('id');
                    const interaction = interactions.get(id);
                    //@ts-ignore
                    const url = interaction?.getPageUrl().origin + interaction?.getPageUrl().pathname;
                    const color = "#"+_this.intToRGB(_this.hashCode(url));
                    //@ts-ignore
                    if(!pages.find(page => page.url == url)) pages.push({url:url,color:color});
                    return color;
                }
                }
            },

            {
                selector: 'edge',
                style: {
                'width': 4,
                'target-arrow-shape': 'triangle',
                'line-color': '#9dbaea',
                'target-arrow-color': '#9dbaea',
                'curve-style': 'bezier'
                }
            }
            ],

            elements: {
            nodes: mappedNodes,
            edges: mappedEdges
            }
        });

        //@ts-ignore
        _this.renderPageLegend(pages);
    }

    private renderPageLegend(pages){
        const legend = document.getElementById("legend");
        //@ts-ignore
        legend.innerHTML = '';
    
        pages.forEach(page => {
            const li = document.createElement("LI");
            const span = document.createElement("SPAN");
            span.setAttribute("style",`background:${page.color}`);
            const text = document.createTextNode(page.url);
            li.appendChild(span);
            li.appendChild(text);
            //@ts-ignore
            legend.appendChild(li);
        });

        //<li><span style='background:rgb(58, 196, 255);'></span>http://localhost/teste/</li>
        //<li><span style='background: rgb(173, 39, 126);'></span>http://localhost/teste/</li>
    }

    //UTIL

    private hashCode(str) { // java String#hashCode
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    } 

    private intToRGB(i){
        var c = (i & 0x00FFFFFF)
            .toString(16)
            .toUpperCase();

        return "00000".substring(0, 6 - c.length) + c;
    }

}