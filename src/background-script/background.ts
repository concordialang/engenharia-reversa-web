//const bkg : Window | null = chrome.extension.getBackgroundPage();

import { ExtensionFacade } from './extension/ExtensionFacade';
import { ChromeExtension } from './extension/ChromeExtension';
import { Extension } from './extension/Extension';
import { CodeChangeMonitor } from './extension/CodeChangeMonitor';
import { InMemoryDatabase } from './extension/InMemoryDatabase';
import { CommunicationChannel } from '../shared/comm/CommunicationChannel';
import { ChromeCommunicationChannel } from '../shared/comm/ChromeCommunicationChannel';
import { IndexedDBObjectStorage } from '../shared/storage/IndexedDBObjectStorage';
import { getConfig } from '../content-script/util';

const extension: Extension = new ChromeExtension(chrome);

const codeChangeMonitor = new CodeChangeMonitor(extension);

codeChangeMonitor.checkForModification(() => extension.reload());

//Reloads all tabs running on development environment, to reload the content script
extension.searchTab({ url: 'http://localhost/*' }).then((tabs) => {
	for (let tab of tabs) {
		extension.reloadTab(tab.getId().toString());
	}
});

const communicationChannel: CommunicationChannel = new ChromeCommunicationChannel(chrome);
const inMemoryDatabase = new InMemoryDatabase();
getConfig(new IndexedDBObjectStorage<string>('config', 'config')).then((config) => {
	const manager: ExtensionFacade = new ExtensionFacade(
		extension,
		communicationChannel,
		inMemoryDatabase,
		4,
		config
	);
	manager.setup();
});
