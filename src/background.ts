//const bkg : Window | null = chrome.extension.getBackgroundPage();

import { ExtensionManager } from './app/extension/ExtensionManager';
import { ChromeExtension } from './app/extension/ChromeExtension';
import { Extension } from './app/extension/Extension';
import { CommunicationChannel } from './app/comm/CommunicationChannel';
import { ChromeCommunicationChannel } from './app/comm/ChromeCommunicationChannel';

let extension: Extension = new ChromeExtension();

let lastModifiedDate : Date|null = null;

//Reloads tabs running on development environment in case they were not yet opened/crawled by the extension
chrome.tabs.query ({ url : "http://localhost/*" }, function(tabs){
	for(let tab of tabs){
		if(tab.id){
			chrome.tabs.reload(Number(tab.id))
		}
	}
});

function checkForReload(){
	chrome.runtime.getPackageDirectoryEntry (function(dir){
		dir.getFile("reload",{},function(file){
			file.getMetadata(function(metadata){
				if(!lastModifiedDate){
					lastModifiedDate = metadata.modificationTime;
				} else if(metadata.modificationTime > lastModifiedDate){
					chrome.runtime.reload();
				}
				checkForReload();
			})
		});
	});
}

chrome.management.getSelf (self => {
	if (self.installType === 'development') {
		checkForReload();
	}
})

let communicationChannel: CommunicationChannel = new ChromeCommunicationChannel();
let manager: ExtensionManager = new ExtensionManager(
	extension,
	communicationChannel,
	1
);
manager.setup();
