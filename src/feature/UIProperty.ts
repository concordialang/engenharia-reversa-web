import { DataTypes } from '../types/DataTypes';
import { EditableTypes } from '../types/EditableTypes';
import { PropertyTypes } from '../types/PropertyTypes';

export class UIProperty {
	private name!: string;
	private value: any;

	constructor(name: string, value: any) {
		this.setName(name);
		this.setValue(value);
	}

	//name
	public setName(name: string) {
		this.name = name;
	}

	public getName() {
		return this.name;
	}

	//value
	public setValue(value: any) {
		if (this.name == PropertyTypes.TYPE) {
			if (value == 'text' || value == 'textbox' || value == 'number') {
				value = EditableTypes.TEXTBOX;
			}

			if (Object.values(EditableTypes).includes(value)) {
				this.value = value;
			}
		} else if (this.name == PropertyTypes.DATATYPE) {
			if (value == 'text') {
				value = DataTypes.STRING;
			} else if (value == 'datetime-local') {
				value = DataTypes.DATETIME;
			} else if (value == 'checkbox') {
				value = DataTypes.CHECKBOX;
			}

			if (Object.values(DataTypes).includes(value)) {
				this.value = value;
			}
		} else {
			this.value = value;
		}
	}

	public getValue() {
		return this.value;
	}
}
