import { Tab } from './Tab';
import { Message } from './Message';

export interface CommunicationChannel {
	sendMessageToAll(message: Message): Promise<Message>;

	//se o sender foi a propria extensão, sender vem undefined
	setMessageListener(callback: (message: Message, sender?: Tab) => void): void;
}
