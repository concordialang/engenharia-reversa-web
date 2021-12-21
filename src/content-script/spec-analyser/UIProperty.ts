export class UIProperty {
	constructor(private name: string, private value: any, private isXPathId?: boolean) {}

	// name
	public setName(name: string) {
		this.name = name;
	}

	public getName() {
		return this.name;
	}

	// value
	public setValue(value: any) {
		this.value = value;
	}

	public getValue() {
		return this.value;
	}

	public isXPathIdProp() {
		return this.isXPathId && this.isXPathId === true;
	}
}
