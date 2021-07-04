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

	// name
	public setName(name: string) {
		this.name = name;
	}

	public getName() {
		return this.name;
	}

	// value
	public setValue(value: any) {
		if (this.name == PropertyTypes.TYPE) {
			value = this.getValueForType(value);
		} else if (this.name == PropertyTypes.DATATYPE) {
			value = this.getValueForDataType(value);
		}

		if (value) {
			this.value = value;
		}
	}

	public getValue() {
		return this.value;
	}

	private getValueForType(value: string | null): string | null {
		if (value == 'text' || value == 'textbox' || value == 'number') {
			value = EditableTypes.TEXTBOX;
		}

		value = (Object as any).values(EditableTypes).includes(value) ? value : null;

		return value;
	}

	private getValueForDataType(value: string | null): string | null {
		if (value == 'text') {
			value = DataTypes.STRING;
		} else if (value == 'datetime-local') {
			value = DataTypes.DATETIME;
		} else if (value == 'checkbox') {
			value = DataTypes.CHECKBOX;
		}

		value = (Object as any).values(DataTypes).includes(value) ? value : null;

		return value;
	}
}
