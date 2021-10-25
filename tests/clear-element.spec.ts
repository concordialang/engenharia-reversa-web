import clearElement from '../src/content-script/util';

describe('#clearElement', () => {
	it('does not change an empty element', () => {
		const e = document.createElement('div');
		expect(clearElement(e)).toBe(0);
	});

	it('removes a single child', () => {
		const e = document.createElement('div');
		e?.appendChild(document.createElement('span'));
		expect(clearElement(e)).toBe(1);
	});

	it('removes all child elements', () => {
		const e = document.createElement('div');
		e?.appendChild(document.createElement('div'));
		e?.appendChild(document.createElement('span'));
		e?.appendChild(document.createElement('input'));
		e?.firstChild?.appendChild(document.createElement('input'));
		e?.children?.item(1)?.appendChild(document.createElement('span'));
		expect(clearElement(e)).toBe(3);
	});
});
