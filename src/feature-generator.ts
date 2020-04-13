export class FeatureGenerator {

    // Temporary
    fromElement( element: HTMLElement ): any {
        return {
            uiElements: [
                {
                    name: "Foo",
                    properties: [
                        {
                            name: 'id',
                            value: '#foo'
                        },
                        {
                            name: 'type',
                            value: 'input'
                        }
                    ]
                }
            ]
        };
    }

}