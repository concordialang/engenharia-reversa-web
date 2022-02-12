import { Tab } from './Tab';
import { sleep } from '../../content-script/util';
import { AppEvent } from './AppEvent';
import { Command } from './Command';
import { CommunicationChannel } from './CommunicationChannel';
import { Message } from './Message';

export class ChromeCommunicationChannel implements CommunicationChannel {
	constructor(private chrome) {}

	public sendMessageToAll(message: Message): Promise<any> {
		const _this = this;
		return new Promise(async function (resolve, reject) {
			_this.chrome.runtime.sendMessage(message, (response?) => {
				if (response) {
					const responseMessage = new Message(response.actions, response.extra);
					resolve(responseMessage);
				} else {
					resolve(undefined);
				}
			});
		});
	}

	//se o sender foi a propria extensão, sender vem undefined
	public setMessageListener(
		callback: (
			message: Message,
			sender?: Tab,
			responseCallback?: (response?: Message) => void
		) => void
	): void {
		//criando função no formato que a interface do chrome espera
		const _this = this;
		const cb = function (
			message: { actions: Array<string>; extra: {} },
			sender: chrome.runtime.MessageSender,
			sendResponse: (response?: Message) => void
		) {
			const actions: Array<Command> | Array<AppEvent> = message.actions.map((action) =>
				_this.mapToActionEnum(action)
			);
			const messageObj = new Message(actions, message.extra);

			//se mensagem veio de uma tab, sender.tab é preenchido pelo chrome, se não, veio da extensão
			if (sender.tab) {
				//lancar excecao se tab vier sem id
				if (sender.tab.id) {
					let url: URL|null = null;
					if(sender.tab.url){
						url = new URL(sender.tab.url);
					}
					const senderObj = new Tab(sender.tab.id?.toString(), url);
					callback(messageObj, senderObj, sendResponse);
				}
			} else {
				callback(messageObj);
			}
			return true;
		};
		this.chrome.runtime.onMessage.addListener(cb);
	}

	private mapToActionEnum(action: string) {
		const command = this.getEnumKeyByEnumValue(Command, action);
		const event = this.getEnumKeyByEnumValue(AppEvent, action);
		if (command) return command;
		if (event) return event;
		return null;
	}

	private getEnumKeyByEnumValue(myEnum, enumValue) {
		let keys = Object.keys(myEnum).filter((x) => myEnum[x] == enumValue);
		return keys.length > 0 ? myEnum[keys[0]] : null;
	}
}
