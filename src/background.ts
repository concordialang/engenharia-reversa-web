//const bkg : Window | null = chrome.extension.getBackgroundPage();

import { ExtensionManager } from './extension/ExtensionManager';
import { ChromeExtension } from './extension/ChromeExtension';
import { Extension } from './extension/Extension';
import { CommunicationChannel } from './comm/CommunicationChannel';
import { ChromeCommunicationChannel } from './comm/ChromeCommunicationChannel';
import { CodeChangeMonitor } from './extension/CodeChangeMonitor';

const extension: Extension = new ChromeExtension();

const codeChangeMonitor = new CodeChangeMonitor(extension);

codeChangeMonitor.checkForModification(() => extension.reload());

//Reloads all tabs running on development environment, to reload the content script
extension.searchTab({ url: 'http://localhost/*' }).then((tabs) => {
	for (let tab of tabs) {
		extension.reloadTab(tab.getId().toString());
	}
});

const communicationChannel: CommunicationChannel = new ChromeCommunicationChannel();
const manager: ExtensionManager = new ExtensionManager(extension, communicationChannel, 1);
manager.setup();
