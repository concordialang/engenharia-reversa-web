import { Import } from './Import';
import { Scenario } from './Scenario';
import { UIElement } from './UIElement';

export class Feature {
	private name: string;
	private imports: Import[];
	private scenarios: Scenario[];
	private uiElements: UIElement[];
	public InteractedElements: Array<{
		xpath: string;
		count: number;
		variantName: string;
		radioGroupName: string | null;
	}>;

	constructor() {
		this.name = '';
		this.imports = [];
		this.scenarios = [];
		this.uiElements = [];
		this.InteractedElements = [];
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

	public addScenario(scenario: Scenario): void {
		this.scenarios.push(scenario);
	}

	public getScenarios(): Array<Scenario> {
		return this.scenarios;
	}
}
