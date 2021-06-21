import { IndexedDBObjectStorage } from './IndexedDBObjectStorage';

// FIXME Refatorar para PageHTMLStorage
export class PageStorage extends IndexedDBObjectStorage<string> {
	getStoreName(): string {
		return 'pages';
	}
}
