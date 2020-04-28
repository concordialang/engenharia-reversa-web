import { FeatureGenerator } from "../src/app/feature-generators/FeatureGenerator";
import clearElement from "../src/util/clear-element";

describe( 'UIElementGenerator', () => {

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
        expect( uiElement?.properties ).toHaveLength( 3 );

        const prop0 = uiElement.properties[ 0 ];
        expect( prop0?.name ).toBe( 'id' );
        expect( prop0?.value ).toBe( '#foo' );

        const prop1 = uiElement.properties[ 1 ];
        expect( prop1?.name ).toBe( 'type' );
        expect( prop1?.value ).toBe( 'textbox' );

        const prop2 = uiElement.properties[ 2 ];
        expect( prop2?.name ).toBe( 'editabled' );
        expect( prop2?.value ).toBe( true );
    } );

    
    it( 'detects input with all properties', () => {
        const input = document.createElement( 'input' );
        
        input.id = 'foo';
        input.value = 'foo';
        input.name = 'Foo';
        input.minLength = 1;
        input.maxLength = 10;
        input.min = '0';
        input.max = '100';
        input.pattern = "[0-9]";

        input.disabled = false;
        document.body.appendChild( input );

        const feature = generator.fromElement( document.body );
        expect( feature?.uiElements ).toHaveLength( 1 );

        const uiElement = feature?.uiElements[ 0 ];
        expect( uiElement.name ).toBe( 'Foo' );
        expect( uiElement.properties ).toHaveLength( 9 );

        const prop0 = uiElement.properties[ 0 ];
        expect( prop0.name ).toBe( 'id' );
        expect( prop0.value ).toBe( '#foo' );

        const prop1 = uiElement.properties[ 1 ];
        expect( prop1.name ).toBe( 'type' );
        expect( prop1.value ).toBe( 'textbox' );

        const prop2 = uiElement.properties[ 2 ];
        expect( prop2.name ).toBe( 'editabled' );
        expect( prop2.value ).toBe( true );

        const prop3 = uiElement.properties[ 3 ];
        expect( prop3.name ).toBe( 'value' );
        expect( prop3.value ).toBe( 'foo' );

        const prop4 = uiElement.properties[ 4 ];
        expect( prop4.name ).toBe( 'min_length' );
        expect( prop4.value ).toBe( 1 );

        const prop5 = uiElement.properties[ 5 ];
        expect( prop5.name ).toBe( 'max_length' );
        expect( prop5.value ).toBe( 10 );

        const prop6 = uiElement.properties[ 6 ];
        expect( prop6.name ).toBe( 'min_value' );
        expect( prop6.value ).toBe( "0" );

        const prop7 = uiElement.properties[ 7 ];
        expect( prop7.name ).toBe( 'max_value' );
        expect( prop7.value ).toBe( "100" );

        const prop8 = uiElement.properties[ 8 ];
        expect( prop8.name ).toBe( 'format' );
        expect( prop8.value ).toBe( "[0-9]" );
    } );
} );