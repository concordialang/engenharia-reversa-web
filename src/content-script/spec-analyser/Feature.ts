import { Type } from 'class-transformer';
import { Import } from './Import';
import { Scenario } from './Scenario';
import { UIElement } from './UIElement';

export class Feature {
	private name: string;
	private id: string;
	public ignoreFormElements: boolean;
	public InteractedElements: Array<{
		xpath: string;
		count: number;
		variantName: string;
		radioGroupName: string | null;
		elmType: string;
	}>;

	@Type(() => Import)
	private imports: Array<Import>;

	@Type(() => Scenario)
	private scenarios: Array<Scenario>;

	@Type(() => UIElement)
	private uiElements: Array<UIElement>;

	constructor(id?: string) {
		this.name = '';
		this.ignoreFormElements = false;
		this.imports = [];
		this.scenarios = [];
		this.uiElements = [];
		this.InteractedElements = [];
		this.id = id || Math.random().toString(18).substring(2);
	}

	public setName(name: string): void {
		this.name = name;
	}

	public getName(): string {
		return this.name;
	}

	public getId(): string {
		return this.id;
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

	public getGeneralScenario(): Scenario {
		return this.scenarios[0];
	}
}
