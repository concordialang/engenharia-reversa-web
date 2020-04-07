/**
 * Clear elements from the given element.
 *
 * @param element element to clear
 * @returns the number of removed elements.
 */
const clearElement = ( element: HTMLElement ): number => {
    let removed: number = 0;
    let e;
    while ( e = element.firstChild ) {
        element.removeChild( e );
        ++removed;
    }
    return removed;
};

export default clearElement;