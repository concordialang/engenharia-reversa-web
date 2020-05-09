import { GraphStorage } from "./graph/GraphStorage";
import { Graph } from "./graph/Graph";
import { Mutex } from "./mutex/Mutex";

//classe deve ser refatorada
export class Crawler {

    private graphStorage : GraphStorage;
    //abstrair mutex em classe
    private mutex : Mutex;

    //aux variables
    private closeWindow = false;

    constructor( graphStorage : GraphStorage, mutex : Mutex ){
        this.graphStorage = graphStorage;
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

                this.setUrlAsCrawled(new URL(links[i].href));
                chrome.runtime.sendMessage({ acao: "abrir-janela", url: links[i].href });
                
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
    private getCrawledUrls() : Array<string> {
        let urlsAnalisadas : string|null = window.localStorage.getItem("urls-analisadas");
        if(urlsAnalisadas){
            return JSON.parse(urlsAnalisadas);
        }
        else{
            return [];
        }
    }
    
    //colocar em classe separada
    private wasUrlAlreadyCrawled(url : URL) : boolean {
        const urlsVisitadas : Array<string> = this.getCrawledUrls();
        for(let urlVisitada of urlsVisitadas){
            if(this.areURLsEqual(new URL(urlVisitada),url)){
                return true;
            }
        }
        return false;
    }

    //colocar em classe separada
    private setUrlAsCrawled(url : URL) : void {
        let urlsAnalisadas : Array<String> = this.getCrawledUrls();
        urlsAnalisadas.push(url.toString());
        window.localStorage.setItem("urls-analisadas",JSON.stringify(urlsAnalisadas));
    }
    
    private areURLsEqual(url1 : URL,url2 : URL) : boolean{
        return url1.toString() == url2.toString();
    }

    private sameHostname(url1 : URL, url2 : URL) : boolean{
        return url1.hostname === url2.hostname;
    }

}