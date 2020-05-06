import { NodeTypes } from '../node/NodeTypes';
import { Feature } from '../feature-structure/Feature';
import { Scenario } from '../feature-structure/Scenario';

class Spec {

    public features: Array< Feature > = [];

    constructor(
        public readonly language: string
    ) {
    }

}

export class Ideia {

    analyze( e: HTMLElement, spec: Spec ) {
        const forms = this.findForms( e );
        for ( const f of forms ) {
            this.createFeatureFromForm( f, spec );
        }
    }

    findForms( e: HTMLElement ): Array< HTMLElement > {
        return Array.from( e.querySelectorAll( 'form' ) );
    }

    createFeatureFromForm( f: HTMLElement, spec: Spec ) {

        const title: HTMLElement = this.titleBeforeForm( f );

        const feature = new Feature();
        feature.name = title
            ? title.textContent
            : this.generateFeatureName( spec.features.length, spec.language );

        spec.features.push( feature );

        const scenario = new Scenario();
        scenario.name = 'Scenario 1'; // TO-DO mudar
        feature.addScenario( scenario );

        const uiElements = this.createUIElementsFromForm( e );

        feature.setUIElements( uiElements );

        const variant = this.generateVariantFromUIElements( uiElements );
        scenario.addVariant( variant );

        const variant2 = this.createVariantFromMandatoryUIElements( uiElements );
        if ( ! variant2 ) {
            scenario.addVariant( variant2 );
        }

        // ...

        return feature;
    }

    titleBeforeForm( f: HTMLElement ): HTMLElement | null {
        if ( f.parentNode?.nodeName === NodeTypes.H1 ||
            f.parentNode?.nodeName === NodeTypes.H2
        ) {
            return f.parentNode;
        }
        return null;
    }

    generateFeatureName( featureCount: number, language: string ): string {
        const id = 1 + featureCount;
        switch ( language ) {
            case 'pt': return 'Funcionalidade ' + id;
            default : return 'Feature ' + id;
        }
    }

}
