import { Message } from "./Message";

export interface CommunicationChannel {

    sendMessageToAll(message : Message) : Promise <void>;

    // substituir any por classe que represente mensagem
    //abstrair MessageSender
    setMessageListener(callback : (message : any, sender: chrome.runtime.MessageSender) => void ) : void;

}