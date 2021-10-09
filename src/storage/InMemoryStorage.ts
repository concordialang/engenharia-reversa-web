import { ClassConstructor, classToPlain, plainToClass } from 'class-transformer';
import { Command } from '../comm/Command';
import { CommunicationChannel } from '../comm/CommunicationChannel';
import { Message } from '../comm/Message';
import { ObjectStorage } from './ObjectStorage';

export class InMemoryStorage<Type> implements ObjectStorage<Type> {
	/*
		Por conta da reflexão do Typescript ser ruim é necessário informar a 
		classe no construtor também 
	*/
	constructor(
		private communicationChannel: CommunicationChannel,
		private typeConstructor?: ClassConstructor<unknown>
	) {}

	async set(key: string, obj: Type): Promise<void> {
		const json = classToPlain(obj);
		const message = new Message([Command.SetValueInMemoryDatabase], {
			key: key,
			value: json,
		});
		this.communicationChannel.sendMessageToAll(message);
	}

	async get(key: string): Promise<Type | null> {
		const message = new Message([Command.GetValueFromMemoryDatabase], {
			key: key,
		});
		const response = await this.communicationChannel.sendMessageToAll(message);
		const json = response.getExtra();
		if (this.typeConstructor) {
			return <Type>plainToClass(this.typeConstructor, json);
		}
		return json;
	}

	async remove(key: string): Promise<void> {
		const message = new Message([Command.RemoveValueFromMemoryDatabase], {
			key: key,
		});
		await this.communicationChannel.sendMessageToAll(message);
	}
}
