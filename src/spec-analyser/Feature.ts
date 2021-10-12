import { Type } from 'class-transformer';
import { Import } from './Import';
import { Scenario } from './Scenario';
import { UIElement } from './UIElement';

export class Feature {
	private name: string;

	@Type(() => Import)
	private imports: Array<Import>;

	@Type(() => Scenario)
	private scenarios: Array<Scenario>;

	@Type(() => UIElement)
	private uiElements: Array<UIElement>;

	constructor() {
		this.name = '';
		this.imports = [];
		this.scenarios = [];
		this.uiElements = [];
	}

	public setName(name: string): void {
		this.name = name;
	}

	public getName(): string {
		return this.name;
	}

	public addUiElement(uiElement: UIElement): void {
		this.uiElements.push(uiElement);
	}

	public setUiElements(uiElements: Array<UIElement>): void {
		this.uiElements = uiElements;
	}

	public getUiElements(): Array<UIElement> {
		return this.uiElements;
	}

	public addScenario(scenario: Scenario): void {
		this.scenarios.push(scenario);
	}

	public getScenarios(): Array<Scenario> {
		return this.scenarios;
	}

	public setImports(imports: Import[]): void {
		this.imports = imports;
	}

	public getImports(): Import[] {
		return this.imports;
	}
}
