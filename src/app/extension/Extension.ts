import { Tab } from "./Tab";
import { ExtensionBrowserAction } from "./ExtensionBrowserAction";

export interface Extension {

    // substituir {} por classe que represente mensagem
    sendMessageToTab(tabId : string, message : {}) : Promise<void>;

    openNewTab(url : URL) : Promise<Tab>;

    setBrowserActionListener(action : ExtensionBrowserAction, callback : (tab : Tab) => void) : void;

}