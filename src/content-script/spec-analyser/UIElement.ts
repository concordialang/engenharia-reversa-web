import { UIProperty } from './UIProperty';
import { Type } from 'class-transformer';
import 'reflect-metadata';
import { TransformHTMLElement } from '../decorators';

export class UIElement {
	private name: string;
	private value: string | null;

	@Type(() => UIProperty)
	private properties: Array<UIProperty>;

	@TransformHTMLElement()
	private sourceElement?: Element;

	constructor(sourceElement?: Element) {
		this.name = '';
		this.value = null;
		this.properties = new Array();
		this.sourceElement = sourceElement;
	}

	public setName(name: string) {
		this.name = name;
	}

	public getName() {
		return this.name;
	}

	public setValue(value: string) {
		this.value = value;
	}

	public getValue() {
		return this.value;
	}

	public setProperty(property: UIProperty) {
		this.properties.push(property);
	}

	public setProperties(properties: Array<UIProperty>) {
		this.properties = properties;
	}

	public getProperties() {
		return this.properties;
	}

	public getId() {
		return this.properties.find((property) => property.getName() === 'id')?.getValue();
	}

	public getType() {
		return this.properties.find((property) => property.getName() === 'type')?.getValue();
	}

	public getSourceElement() {
		return this.sourceElement;
	}
}
