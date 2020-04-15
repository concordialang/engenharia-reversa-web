import { FeatureGenerator } from "../src/feature-generator";
import clearElement from "../src/util/clear-element";

describe( 'FeatureGenerator', () => {

    let generator: FeatureGenerator;

    beforeEach( () => {
        generator = new FeatureGenerator();
    } );

    afterEach( () => {
        clearElement( document.body );
    } );

    it( 'detects input with id', () => {
        const input = document.createElement( 'input' );
        input.id = 'foo';
        document.body.appendChild( input );
        const feature = generator.fromElement( document.body );
        expect( feature?.uiElements ).toHaveLength( 1 );

        const uiElement = feature?.uiElements[ 0 ];
        expect( uiElement?.name ).toBe( 'Foo' );
        expect( uiElement?.properties ).toHaveLength( 2 );

        const prop0 = uiElement.properties[ 0 ];
        expect( prop0?.name ).toBe( 'id' );
        expect( prop0?.value ).toBe( '#foo' );

        const prop1 = uiElement.properties[ 1 ];
        expect( prop1?.name ).toBe( 'type' );
        expect( prop1?.value ).toBe( 'input' );
    } );

} );