//const bkg : Window | null = chrome.extension.getBackgroundPage();

import { ExtensionManager } from './app/extension/ExtensionManager';
import { ChromeExtension } from './app/extension/ChromeExtension';
import { Extension } from './app/extension/Extension';
import { CommunicationChannel } from './app/comm/CommunicationChannel';
import { ChromeCommunicationChannel } from './app/comm/ChromeCommunicationChannel';

let extension: Extension = new ChromeExtension();
let communicationChannel: CommunicationChannel = new ChromeCommunicationChannel();
let manager: ExtensionManager = new ExtensionManager(
	extension,
	communicationChannel
);
manager.setup();
