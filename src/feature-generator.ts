//import { UIElementGenerator } from "./app/elements-handler/uielement-generator.ts";

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

    // fromElement( element: HTMLElement ): any {
    //     let uiElement = new UIElementGenerator();

    //     return uiElement.generateUIElement();
    // }

}