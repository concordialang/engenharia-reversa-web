export interface CommunicationChannel {

    // substituir {} por classe que represente mensagem
    sendMessageToAll(message : {}) : Promise <void>;

    // substituir any por classe que represente mensagem
    //abstrair MessageSender
    setMessageListener(callback : (message : any, sender: chrome.runtime.MessageSender) => void ) : void;

}