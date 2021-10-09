export class ChromeMock {
	public runtime: RunTimeMock;
	public browserAction: BrowserAction;

	public constructor() {
		this.runtime = new RunTimeMock();
		this.browserAction = new BrowserAction();
	}
}

class RunTimeMock {
	public onMessage: OnMessage;
	public MessageSender: MessageSender;

	public constructor() {
		this.onMessage = new OnMessage();
		this.MessageSender = new MessageSender();
	}

	public sendMessage(message: any, responseCallback: CallableFunction) {
		this.onMessage.sendMessageToListeners(message, this.MessageSender, responseCallback);
	}
}

class MessageSender {
	public tab: { id: string };
	public constructor(tabId: string = '1') {
		this.tab = { id: tabId };
	}
}

class OnMessage {
	private listeners: CallableFunction[] = [];

	public addListener(
		callback: (message: any, sender: MessageSender, sendResponse: CallableFunction) => void
	) {
		this.listeners.push(callback);
	}

	public sendMessageToListeners(
		message: any,
		sender: MessageSender,
		sendReponse: CallableFunction
	) {
		for (let listener of this.listeners) {
			listener(message, sender, sendReponse);
		}
	}
}

class BrowserAction {
	public onClicked: BrowserEvent;

	public constructor() {
		this.onClicked = new BrowserEvent();
	}
}

class BrowserEvent {
	public addListener() {}
}
