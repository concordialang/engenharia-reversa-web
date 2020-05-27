import { CommunicationChannel } from "./CommunicationChannel";
import { Message } from "./Message";
import { Tab } from "../extension/Tab";
import { Command } from "./Command";
import { AppEvent } from "./AppEvent";

export class ChromeCommunicationChannel implements CommunicationChannel {

    public sendMessageToAll(message : Message) : Promise <void> {
        return new Promise(function(resolve,reject){
            chrome.runtime.sendMessage(message);
            resolve();
        });
    }

    //se o sender foi a propria extensão, sender vem undefined
    public setMessageListener(callback : (message : Message, sender?: Tab) => void ) : void {

        //criando função no formato que a interface do chrome espera
        const _this = this;
        const cb = function(message: {actions:Array<string>,extra: {}}, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void){
            const actions : Array<Command>|Array<AppEvent> = message.actions.map(action => _this.mapToActionEnum(action));
            const messageObj = new Message(actions,message.extra);
            
            //se mensagem veio de uma tab, sender.tab é preenchido pelo chrome, se não, veio da extensão
            if(sender.tab){
                //lancar excecao se tab vier sem id
                if(sender.tab.id){
                    const senderObj = new Tab(sender.tab.id?.toString());
                    callback(messageObj,senderObj);
                }
            }
            else{
                callback(messageObj);
            }
        };
        chrome.runtime.onMessage.addListener(cb);
    }

    private mapToActionEnum(action : string){
        const command = this.getEnumKeyByEnumValue(Command,action);
        const event = this.getEnumKeyByEnumValue(AppEvent,action);
        if(command) return command;
        if(event) return event;
        return null;
    }

    private getEnumKeyByEnumValue(myEnum, enumValue) {
        let keys = Object.keys(myEnum).filter(x => myEnum[x] == enumValue);
        return keys.length > 0 ? myEnum[keys[0]] : null;
    }

}