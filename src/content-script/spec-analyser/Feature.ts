import { Type } from 'class-transformer';
import { Import } from './Import';
import { Scenario } from './Scenario';
import { UIElement } from './UIElement';

export class Feature {
	private name: string = '';
	private maxVariantCount: number = 1;
	public ignoreFormElements: boolean = false;
	public needNewVariants: boolean = false;

	// it also starts to analyze the buttons that are after the final action button, ignoring the final action button
	public analysesBtnsAfterFinalActionBtn: boolean = false;

	// starts to create variant analyzing only the cancel buttons
	public analysesOnlyCancelBtns: boolean = false;

	public interactedElements: Array<{
		xpath: string;
		count: number;
		variantName: string;
		radioGroupName: string | null;
		elmType: string;
	}> = [];

	public btnsAfterFinalActionBtn: Array<{
		xpath: string;
		isCancelButton: boolean;
	}>;

	@Type(() => Import)
	private imports: Array<Import>;

	@Type(() => Scenario)
	private scenarios: Array<Scenario>;

	@Type(() => UIElement)
	private uiElements: Array<UIElement>;

	constructor() {
		this.imports = [];
		this.scenarios = [];
		this.uiElements = [];
		this.interactedElements = [];
		this.btnsAfterFinalActionBtn = [];
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

	public getGeneralScenario(): Scenario {
		return this.scenarios[0];
	}

	public getVariantsCount() {
		return this.scenarios[0].getVariants().length;
	}

	public getMaxVariantsCount() {
		return this.maxVariantCount;
	}

	public setMaxVariantCount(maxVariantCount: number) {
		if (Number.isInteger(maxVariantCount)) {
			this.maxVariantCount = maxVariantCount;
		}
	}
}
