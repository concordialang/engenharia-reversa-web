import { ClassConstructor, classToPlain, plainToClass } from 'class-transformer';
import { Command } from '../../shared/comm/Command';
import { CommunicationChannel } from '../../shared/comm/CommunicationChannel';
import { Message } from '../../shared/comm/Message';
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
		const json = this.serialize(obj);
		const message = new Message([Command.SetValueInMemoryDatabase], {
			key: key,
			value: json,
		});
		this.communicationChannel.sendMessage(message);
	}

	async get(key: string): Promise<Type | null> {
		const message = new Message([Command.GetValueFromMemoryDatabase], {
			key: key,
		});
		const response = await this.communicationChannel.sendMessage(message);
		const json = response.getExtra();
		return this.deserialize(json);
	}

	async remove(key: string): Promise<void> {
		const message = new Message([Command.RemoveValueFromMemoryDatabase], {
			key: key,
		});
		await this.communicationChannel.sendMessage(message);
	}

	protected serialize(obj: Type): {} {
		return classToPlain(obj);
	}

	protected deserialize(json: any): Type {
		if (this.typeConstructor) {
			return <Type>plainToClass(this.typeConstructor, json);
		}
		return json;
	}
}
