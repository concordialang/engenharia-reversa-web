import { Message } from "./Message";
import { Tab } from "../extension/Tab";

export interface CommunicationChannel {

    sendMessageToAll(message : Message) : Promise <void>;

    //se o sender foi a propria extensão, sender vem undefined
    setMessageListener(callback : (message : Message, sender?: Tab) => void ) : void;

}