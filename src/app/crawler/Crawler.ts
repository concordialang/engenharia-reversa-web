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
    private graphKey : string;
    private crawledUrlsKey : string;

    //aux variables
    private closeWindow = false;

    constructor( graphStorage : GraphStorage, crawledUrlsStorage : UrlListStorage, graphKey : string, crawledUrlsKey : string, mutex : Mutex ){
        this.graphStorage = graphStorage;
        this.crawledUrlsStorage = crawledUrlsStorage;
        this.mutex = mutex;
        this.graphKey = graphKey;
        this.crawledUrlsKey = crawledUrlsKey;
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

                this.crawledUrlsStorage.add(this.crawledUrlsKey,new URL(links[i].href));
                chrome.runtime.sendMessage({ action: "open-tab", url: links[i].href });
                
            }
        }
        this.closeWindow = true;
    }

    private searchForLinks() : HTMLCollectionOf<HTMLAnchorElement>{
        return document.getElementsByTagName('a');
    }

    //refatorar função
    private addUrlToGraph(url : URL) : void {
        //mutex deveria ficar dentro de GraphStorage ou em Crawler ?
        this.mutex.lock().then(() => {
            let graph : Graph = this.graphStorage.get(this.graphKey);
            graph.addNode(url.toString());
            this.graphStorage.save(this.graphKey, graph);
            return this.mutex.unlock();
        }).then(() => {
            if(this.closeWindow === true) window.close();
        });
    }

    //refatorar função
    private addUrlsLinkToGraph(urlFrom : URL,urlTo : URL) : void {
        //mutex deveria ficar dentro de GraphStorage ou em Crawler ?
        this.mutex.lock().then(() => {
            let graph : Graph = this.graphStorage.get(this.graphKey);
            graph.addEdge(urlFrom.toString(),urlTo.toString());
            this.graphStorage.save(this.graphKey,graph);
            return this.mutex.unlock();
        }).then(() => {
            if(this.closeWindow === true) window.close();
        });
    }
    
    private wasUrlAlreadyCrawled(url : URL) : boolean {
        return this.crawledUrlsStorage.isUrlInList(this.crawledUrlsKey,url);
    }

    private sameHostname(url1 : URL, url2 : URL) : boolean{
        return url1.hostname === url2.hostname;
    }

}