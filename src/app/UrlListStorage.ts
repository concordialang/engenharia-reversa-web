export class UrlListStorage {

    public add(listKey : string, url : URL) : void {
        let urls : Array<String> = this.getAll(listKey);
        urls.push(url.toString());
        window.localStorage.setItem(listKey,JSON.stringify(urls));
    }

    public getAll(listKey : string){
        let urls : string|null = window.localStorage.getItem(listKey);
        if(urls){
            return JSON.parse(urls);
        }
        else{
            return [];
        }
    }

    public isUrlInList(listKey : string, url : URL) : boolean {
        const urls : Array<string> = this.getAll(listKey);
        for(let urlOfList of urls){
            if(this.areURLsEqual(new URL(urlOfList),url)){
                return true;
            }
        }
        return false;
    }

    public removeAll(listKey : string) : void {
        window.localStorage.removeItem(listKey);
    }

    private areURLsEqual(url1 : URL,url2 : URL) : boolean{
        return url1.toString() == url2.toString();
    }
    
}