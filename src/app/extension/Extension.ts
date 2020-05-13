import { Tab } from "./Tab";

export interface Extension {

    // substituir {} por classe que represente mensagem
    sendMessageToTab(tabId : string, message : {}) : Promise<void>;

    openNewTab(url : URL) : Promise<Tab>;

    setBrowserActionListener(action : string, callback : CallableFunction) : void;

}