import { Message } from '../../shared/comm/Message';
import { ExtensionBrowserAction } from './ExtensionBrowserAction';
import { Tab } from '../../shared/comm/Tab';

export interface Extension {
	sendMessageToTab(tabId: string, message: Message): Promise<void>;

	openNewTab(url: URL): Promise<Tab>;

	setBrowserActionListener(action: ExtensionBrowserAction, callback: (tab: Tab) => void): void;

	reloadTab(tabId: string): Promise<void>;

	reload(): void;

	getFileSystemEntry(path: string): Promise<FileEntry>;

	searchTab(queryInfo: Object): Promise<Tab[]>;
}
