export class Config {
    constructor(
        public language: string = 'pt',
        public timeBetweenInteractions: number = 100,
        public limitOfVariants: number = 25,
        public minimumChildNodesNumberForDiff: number = 3,
        public strHtmlTagsForDiff: string = 'form, div, label, span, input, select, textarea, button, a, table',
        public maxWaitTimeForUnload: number = 5000,
        public considerFullUrl: URL[] = [
            new URL('http://localhost/htdocs/product/fiche.php?leftmenu=service&action=create&type=1')
        ]
    ) {

    }
}