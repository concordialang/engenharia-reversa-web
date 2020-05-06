export interface Browser {

    sendMessageToTab(tabId : string, message : any) : Promise<any>;

    openNewTab(url : URL) : Promise<any>;

}