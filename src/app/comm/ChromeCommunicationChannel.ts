import { CommunicationChannel } from "./CommunicationChannel";
import { Message } from "./Message";

export class ChromeCommunicationChannel implements CommunicationChannel {

    // substituir {} por classe que represente mensagem
    public sendMessageToAll(message : Message) : Promise <void> {
        return new Promise(function(resolve,reject){
            chrome.runtime.sendMessage(message);
            resolve();
        });
    }

    // substituir any por classe que represente mensagem
    //abstrair MessageSender
    public setMessageListener(callback : (message : any, sender: chrome.runtime.MessageSender) => void ) : void {

        //criando função no formato que a interface do chrome espera
        const cb = function(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void){
            callback(message,sender);
        };
        chrome.runtime.onMessage.addListener(cb);
    }

}