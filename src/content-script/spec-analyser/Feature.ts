import { Type } from 'class-transformer';
import { Import } from './Import';
import { Scenario } from './Scenario';
import { UIElement } from './UIElement';
import { TransformURL } from '../decorators';

export class Feature {
	private name: string = '';
	private id: string;
	private maxVariantCount: number = 1;
	public ignoreFormElements: boolean = false;
	public needNewVariants: boolean = false;

	// it also starts to analyze the clicables (buttons and anchors) 
	// that are after the final action clicable, ignoring the final action clicable
	public analysesClicablesAfterFinalActionClicable: boolean = false;

	// starts to create variant analyzing only the cancel buttons
	public analysesOnlyCancelClicables: boolean = false;

	public interactedElements: Array<{
		xpath: string;
		count: number;
		variantName: string;
		radioGroupName: string | null;
		elmType: string;
	}> = [];

	public clicablesAfterFinalActionClicable: Array<{
		xpath: string;
		isCancelClicable: boolean;
	}>;

	@Type(() => Import)
	private imports: Array<Import>;

	@Type(() => Scenario)
	private scenarios: Array<Scenario>;

	@Type(() => UIElement)
	private uiElements: Array<UIElement>;

	@TransformURL()
	public url?: URL;

	constructor(id?: string) {
		this.imports = [];
		this.scenarios = [];
		this.uiElements = [];
		this.clicablesAfterFinalActionClicable = [];
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

	public addUiElement(uiElement: UIElement): void {
		let alreadyExists = this.uiElements.some(uiElm => uiElm.getId() === uiElement.getId());

		if(!alreadyExists){
			this.uiElements.push(uiElement);
		}
	}

	public setUiElements(uiElements: Array<UIElement>): void {
		this.uiElements = uiElements;
	}

	public getNumberOfUiElmentsNotOnlyDisplayValue(){
		return this.uiElements.filter(uiElm => !uiElm.onlyDisplayValue).length;
	}
}
