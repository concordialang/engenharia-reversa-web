//const bkg : Window | null = chrome.extension.getBackgroundPage();

import { ExtensionManager } from './app/extension/ExtensionManager';
import { ChromeExtension } from './app/extension/ChromeExtension';
import { Extension } from './app/extension/Extension';
import { CommunicationChannel } from './app/comm/CommunicationChannel';
import { ChromeCommunicationChannel } from './app/comm/ChromeCommunicationChannel';
import { CodeChangeMonitor } from './app/extension/CodeChangeMonitor';

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
