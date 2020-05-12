import { CommunicationChannel } from "./CommunicationChannel";

export class ChromeCommunicationChannel implements CommunicationChannel {

    public sendMessageToAll(message : any) : Promise <any> {
        return new Promise(function(resolve,reject){
            chrome.runtime.sendMessage(message);
            resolve();
        });
    }

    public setMessageListener(callback : any) : void{
        chrome.runtime.onMessage.addListener(callback);
    }

}