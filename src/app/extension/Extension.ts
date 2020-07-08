import { Message } from "../comm/Message";
import { ExtensionBrowserAction } from "./ExtensionBrowserAction";
import { Tab } from "./Tab";

export interface Extension {

    sendMessageToTab(tabId : string, message : Message) : Promise<void>;

    openNewTab(url : URL) : Promise<Tab>;

    setBrowserActionListener(action : ExtensionBrowserAction, callback : (tab : Tab) => void) : void;

}
