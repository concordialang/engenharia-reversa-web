import { Feature } from '../feature-structure/Feature';
import { Scenario } from '../feature-structure/Scenario';
import { Variant } from '../feature-structure/Variant';
import { UIElement } from '../feature-structure/UIElement';
import { UIProperty } from '../feature-structure/UIProperty';
import { VariantSentence } from '../feature-structure/VariantSentence';
import { Import } from '../feature-structure/Import';

/**
 * Parsing context.
 *
 * @author Thiago Delgado Pinto
 */
export class ContextGenerator {

    feature: any;

    inFeature: boolean = false;
    inScenario: boolean = false;
    inVariant: boolean = false;
    inVariantSentence: boolean = false;
    inUIElement: boolean = false;
    inUIProperty: boolean = false;
    inImport: boolean = false;
    inBeforeAll: boolean = false;
    inAfterAll: boolean = false;
    inBeforeFeature: boolean = false;
    inAfterFeature: boolean = false;
    inBeforeEachScenario: boolean = false;
    inAfterEachScenario: boolean = false;

    // currentFeature: Feature = null;
    // currentScenario: Scenario = null;
    // currentVariant: Variant = null;
    // currentVariantSentence: VariantSentence = null;
    // currentUIElement: UIElement = null;
    // currentUIProperty: UIProperty = null;
    // currentImport: Import = null;

    currentFeature: any = null;
    currentScenario: any = null;
    currentVariant: any = null;
    currentVariantSentence: any = null;
    currentUIElement: any = null;
    currentUIProperty: any = null;
    currentImport: any = null;

    constructor( feature?: Feature) {
        if ( feature ) {
            this.feature = feature;
        }
    }

    public resetInValues(): void {
        this.inFeature = false;
        this.inScenario = false;
        this.inVariant = false;
        this.inVariantSentence = false;
        this.inUIProperty = false;
        this.inImport = false;
        this.inBeforeAll = false;
        this.inAfterAll = false;
        this.inBeforeFeature = false;
        this.inAfterFeature = false;
        this.inBeforeEachScenario = false;
        this.inAfterEachScenario = false;
    }
}