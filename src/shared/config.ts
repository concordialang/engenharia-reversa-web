export class Config {
    constructor(
        public language: string = 'pt',

        // wait time between interactions in milliseconds
        public timeBetweenInteractions: number = 100,

        // maximum number of variants a feature can create
        public limitOfVariants: number = 25,

        // minimum number of child nodes to consider element in diffDom
        public minimumChildNodesNumberForDiff: number = 3,

        // html tags to consider in the diff child nodes 
        public strHtmlTagsForDiff: string = 'form, div, label, span, input, select, textarea, button, a, table',

        // percentage of tolerated interactive cells to consider as listing table row
        // public interactableCellTolerancePercent: number = 40,

        public maxWaitTimeForUnload: number = 5000,

        public considerFullUrl: URL[] = [
            new URL('http://localhost/htdocs/product/fiche.php?leftmenu=service&action=create&type=1')
        ],

        public interactableCellTolerancePercent = 40,
    ) {

    }
}