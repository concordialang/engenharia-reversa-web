import { Tab } from "./Tab";
import { ExtensionBrowserAction } from "./ExtensionBrowserAction";
import { Message } from "../comm/Message";

export interface Extension {

    sendMessageToTab(tabId : string, message : Message) : Promise<void>;

    openNewTab(url : URL) : Promise<Tab>;

    setBrowserActionListener(action : ExtensionBrowserAction, callback : (tab : Tab) => void) : void;

}