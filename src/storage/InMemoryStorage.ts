import { Command } from '../comm/Command';
import { CommunicationChannel } from '../comm/CommunicationChannel';
import { Message } from '../comm/Message';
import { ObjectStorage } from './ObjectStorage';

export class InMemoryStorage<Type> implements ObjectStorage<Type> {
	constructor(private communicationChannel: CommunicationChannel) {}

	async set(key: string, obj: Type): Promise<void> {
		const message = new Message([Command.SetValueInMemoryDatabase], {
			key: key,
			value: obj,
		});
		this.communicationChannel.sendMessageToAll(message);
	}

	async get(key: string): Promise<Type | null> {
		const message = new Message([Command.GetValueFromMemoryDatabase], {
			key: key,
		});
		const response = await this.communicationChannel.sendMessageToAll(message);
		return response.getExtra();
	}

	async remove(key: string): Promise<void> {
		const message = new Message([Command.RemoveValueFromMemoryDatabase], {
			key: key,
		});
		await this.communicationChannel.sendMessageToAll(message);
	}
}
