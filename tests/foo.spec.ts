import { Foo } from "../src/foo";

describe( 'Foo', () => {

    it( 'soma dois números', () => {
        const f = new Foo();
        expect( f.soma( 2, 2 ) ).toBe( 4 );
    } );

} );