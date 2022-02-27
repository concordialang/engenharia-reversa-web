import { UIProperty } from './UIProperty';
import { Type } from 'class-transformer';
import 'reflect-metadata';
import { TransformHTMLElement } from '../decorators';
import { PropertyTypes } from '../enums/PropertyTypes';

export class UIElement {
	private name: string;
	private value: string | null;
	public onlyDisplayValue: boolean = false;

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

	public setValue(value: string | null) {
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

	public getId(completeProp = false) {
		const id = this.properties.find((property) => property.getName() === PropertyTypes.ID);
		
		return completeProp ? id : id?.getValue();
	}

	public getType() {
		return this.properties
			.find((property) => property.getName() === PropertyTypes.TYPE)
			?.getValue();
	}

	public getInnexTextValue() {
		let value = this.properties
			.find((property) => {
				return (
					property.getName() === PropertyTypes.VALUE && property.isInnerTextValueProp()
				);
			})
			?.getValue();

		return value ? value : null;
	}

	public getSourceElement() {
		return this.sourceElement;
	}
}
