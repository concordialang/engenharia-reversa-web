export class UIProperty {
	constructor(private name: string, private value: any) {}

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
}
