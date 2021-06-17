import { Tab } from '../extension/Tab';
import { Message } from './Message';

export interface CommunicationChannel {
	sendMessageToAll(message: Message): Promise<void>;

	//se o sender foi a propria extensão, sender vem undefined
	setMessageListener(callback: (message: Message, sender?: Tab) => void): void;
}
