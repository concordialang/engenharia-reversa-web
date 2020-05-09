export interface CommunicationChannel {

    sendMessageToAll(message : any) : Promise <any>;

    setMessageListener(callback : any) : void;

}