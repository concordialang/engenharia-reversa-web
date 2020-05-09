export interface Extension {

    sendMessageToTab(tabId : string, message : any) : Promise<any>;

    openNewTab(url : URL) : Promise<any>;

    setBrowserActionListener(action : string, callback : any) : void;

}