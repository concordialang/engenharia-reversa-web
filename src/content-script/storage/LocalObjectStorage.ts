import { ClassConstructor, classToPlain, plainToClass } from 'class-transformer';
import { ObjectStorage } from './ObjectStorage';

export class LocalObjectStorage<Type> implements ObjectStorage<Type> {
	/*
		Por conta da reflexão do Typescript ser ruim é necessário informar a 
		classe no construtor também 
	*/
	constructor(
		private localStorage: Storage,
		private typeConstructor?: ClassConstructor<unknown>
	) {}

	async set(key: string, obj: Type): Promise<void> {
		const json = this.serialize(obj);
		this.localStorage.setItem(key, JSON.stringify(json));
	}

	async get(key: string): Promise<Type | null> {
		const jsonString = this.localStorage.getItem(key);
		if (jsonString) {
			const json = JSON.parse(jsonString);
			return this.deserialize(json);
		}
		return null;
	}

	async remove(key: string): Promise<void> {
		this.localStorage.removeItem(key);
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
