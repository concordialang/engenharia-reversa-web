import { Transform } from 'class-transformer';
import { getElementByXpath, getPathTo } from './util';

export function TransformURL() {
	const toPlain = Transform(
		function ({ value }) {
			if (value) {
				return { href: value.href };
			}
		},
		{
			toPlainOnly: true,
		}
	);

	const toClass = Transform(
		function ({ value }) {
			if (value && value.href) {
				return new URL(value.href);
			}
		},
		{
			toClassOnly: true,
		}
	);

	return function (target: any, key: string) {
		toPlain(target, key);
		toClass(target, key);
	};
}

export function TransformHTMLElement() {
	const toPlain = Transform(
		function ({ value }) {
			return getPathTo(value);
		},
		{
			toPlainOnly: true,
		}
	);

	const toClass = Transform(
		function ({ value }) {
			return <Element>getElementByXpath(value, document);
		},
		{
			toClassOnly: true,
		}
	);

	return function (target: any, key: string) {
		toPlain(target, key);
		toClass(target, key);
	};
}
