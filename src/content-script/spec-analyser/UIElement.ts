import { UIProperty } from './UIProperty';
import { Transform, Type } from 'class-transformer';
import { getElementByXpath, getPathTo } from '../util';
import 'reflect-metadata';
import { TransformHTMLElement } from '../decorators';

export class UIElement {
	private name: string;

	@Type(() => UIProperty)
	private properties: Array<UIProperty>;

	@TransformHTMLElement()
	private sourceElement?: Element;

	constructor(sourceElement?: Element) {
		this.name = '';
		this.properties = new Array();
		this.sourceElement = sourceElement;
	}

	public setName(name: string) {
		this.name = name;
	}

	public getName() {
		return this.name;
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
