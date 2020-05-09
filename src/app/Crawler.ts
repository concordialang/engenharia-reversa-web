import { GraphStorage } from "./graph/GraphStorage";
import { Graph } from "./graph/Graph";
import { Mutex } from "./mutex/Mutex";
import { UrlListStorage } from "./UrlListStorage";

//classe deve ser refatorada
export class Crawler {

    private graphStorage : GraphStorage;
    private crawledUrlsStorage : UrlListStorage;
    //abstrair mutex em classe
    private mutex : Mutex;

    //aux variables
    private closeWindow = false;

    constructor( graphStorage : GraphStorage, crawledUrlsStorage : UrlListStorage, mutex : Mutex ){
        this.graphStorage = graphStorage;
        this.crawledUrlsStorage = crawledUrlsStorage;
        this.mutex = mutex;
    }

    public crawl(){
        const pageUrl : URL = new URL(window.location.href);
        this.addUrlToGraph(pageUrl);
        const links : HTMLCollectionOf<HTMLAnchorElement> = this.searchForLinks();
        for (let i : number = 0; i < links.length; i++) {

            const foundUrl : URL = new URL(links[i].href);
            this.addUrlToGraph(foundUrl);
            this.addUrlsLinkToGraph(pageUrl,foundUrl);
            if(this.sameHostname(foundUrl,pageUrl) && !this.wasUrlAlreadyCrawled(foundUrl)){

                this.crawledUrlsStorage.add("crawled-urls",new URL(links[i].href));
                chrome.runtime.sendMessage({ action: "open-tab", url: links[i].href });
                
            }
        }
        this.closeWindow = true;
    }

    private searchForLinks() : HTMLCollectionOf<HTMLAnchorElement>{
        return document.getElementsByTagName('a');
    }

    //refatorar função
    private addUrlToGraph(url : URL) : void{
        //mutex deveria ficar dentro de GraphStorage ou em Crawler ?
        this.mutex.lock().then(() => {
            let graph : Graph = this.graphStorage.get("grafo");
            graph.addNode(url.toString());
            this.graphStorage.save("grafo", graph);
            return this.mutex.unlock();
        }).then(() => {
            if(this.closeWindow === true) window.close();
        });
    }

    //refatorar função
    private addUrlsLinkToGraph(urlFrom : URL,urlTo : URL) : void{
        this.mutex.lock().then(() => {
            let graph : Graph = this.graphStorage.get("grafo");
            graph.addEdge(urlFrom.toString(),urlTo.toString());
            this.graphStorage.save("grafo",graph);
            return this.mutex.unlock();
        }).then(() => {
            if(this.closeWindow === true) window.close();
        });
    }
    
    //colocar em classe separada
    private wasUrlAlreadyCrawled(url : URL) : boolean {
        return this.crawledUrlsStorage.isUrlInList("crawled-urls",url);
    }

    private sameHostname(url1 : URL, url2 : URL) : boolean{
        return url1.hostname === url2.hostname;
    }

}