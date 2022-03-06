export const language = 'pt';

// wait time between interactions in milliseconds
export const timeBetweenInteractions = 100;

// maximum number of variants a feature can create
export const limitOfVariants = 25;

// minimum number of child nodes to consider element in diffDom
export const minimumChildNodesNumberForDiff = 3;

// html tags to consider in the diff child nodes 
export const strHtmlTagsForDiff = 'form, div, label, span, input, select, textarea, button, a, table';

export const maxWaitTimeForUnload = 5000;

export const considerFullUrl : URL[] = [
    new URL('http://localhost/htdocs/product/fiche.php?leftmenu=service&action=create&type=1')
];



