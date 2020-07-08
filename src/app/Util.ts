export class Util {
	static formatName(name: string): string {
		name = name.replace(':', '');
		name = name.charAt(0).toUpperCase() + name.slice(1);
		return name;
	}

	static isNotEmpty(foo: any) {
		if (foo === undefined || foo === null || foo === '') {
			return false;
		}

		return true;
	}
}
