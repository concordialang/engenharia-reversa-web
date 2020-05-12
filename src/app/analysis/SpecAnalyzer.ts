import { NodeTypes } from '../node/NodeTypes';
import { Feature } from '../feature-structure/Feature';
import { Scenario } from '../feature-structure/Scenario';
import { Spec } from './Spec';
import { UIElementGenerator } from '../feature-generators/UIElementGenerator';

export class SpecAnalyzer {

    analyze( e: HTMLElement, spec: Spec ) {
        const forms = this.findForms( e );
        for ( const f of forms ) {
            this.createFeatureFromForm( f, spec );
        }

        return spec;
    }

    findForms( e: HTMLElement ): Array< HTMLElement > {
        return Array.from( e.querySelectorAll( NodeTypes.FORM ) );
    }

    createFeatureFromForm( f: HTMLElement, spec: Spec ) {

        const title: HTMLElement | null = this.titleBeforeForm( f );

        const feature = new Feature();
        feature.name = title
            ? title.innerHTML
            : this.generateFeatureName( spec.features.length, spec.language );

        spec.features.push( feature );

        const scenario = new Scenario();
        scenario.name = 'Scenario 1'; // TO-DO mudar
        feature.setScenario( scenario );

        let uiElementsGenerator = new UIElementGenerator();
        const uiElements = uiElementsGenerator.createUIElementsFromForm( f );
        feature.setUiElements(uiElements);

        // const variant = this.generateVariantFromUIElements( uiElements );
        // scenario.addVariant( variant );

        // const variant2 = this.createVariantFromMandatoryUIElements( uiElements );
        // if ( ! variant2 ) {
        //     scenario.addVariant( variant2 );
        // }

        // ...

        // return spec;
    }

    titleBeforeForm( f: HTMLElement ): HTMLElement | null {
        if ( f.previousElementSibling?.nodeName === NodeTypes.H1 ||
            f.previousElementSibling?.nodeName === NodeTypes.H2
        ) {
            return f.previousElementSibling as HTMLElement;
        }

        return null;
    }

    generateFeatureName( featureCount: number, language: string ): string {
        const id = 1 + featureCount;
        switch ( language ) {
            case 'pt-br': return 'Funcionalidade ' + id;
            default : return 'Feature ' + id;
        }
    }

}
