import { Tab } from './Tab';
import { Message } from './Message';

export interface CommunicationChannel {
	sendMessage(message: Message): Promise<Message>;

	sendMessageToAll(message: Message): Promise<void>;

	//se o sender foi a propria extensão, sender vem undefined
	setMessageListener(callback: (message: Message, sender?: Tab) => void): void;
}
