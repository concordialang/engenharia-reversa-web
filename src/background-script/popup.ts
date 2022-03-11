import { IndexedDBObjectStorage } from "../shared/storage/IndexedDBObjectStorage";
import { ChromeCommunicationChannel } from "../shared/comm/ChromeCommunicationChannel";
import { Message } from "../shared/comm/Message";
import { Command } from "../shared/comm/Command";
import { IndexedDBDatabases } from "../shared/storage/IndexedDBDatabases";
import { getConfig } from "../content-script/util";

const communicationChannel = new ChromeCommunicationChannel(chrome);

const configStorage = new IndexedDBObjectStorage<string>('config','config');
configStorage.get('test').then(async () => {
    const config = await getConfig(configStorage);
    prepareInput('variant-limit', config.limitOfVariants.toString());
    prepareInput('min-child-node-diff', config.minimumChildNodesNumberForDiff.toString());
    prepareInput('html-tags-for-diff', config.strHtmlTagsForDiff);
    prepareInput('max-wait-time-unload', config.maxWaitTimeForUnload.toString());
    prepareInput('consider-full-url', (config.considerFullUrl.map((url) => url.href)).join('\n'));
    
    const runningStatusStorage = new IndexedDBObjectStorage<boolean>(IndexedDBDatabases.RunningStatus, IndexedDBDatabases.RunningStatus);
    
    const startButton = <HTMLInputElement> document.getElementById('start');
    if(startButton){
        const status = await runningStatusStorage.get('status');
        startButton.value = status ? 'Parar' : 'Iniciar';
        startButton.addEventListener('click', () => {
            startButton.value = status ? 'Iniciar' : 'Parar';
            communicationChannel.sendMessage(new Message([Command.Start]));
        });
    }
});

async function prepareInput(elementId: string, defaultValue: string = ''){
    const input = <HTMLInputElement> document.getElementById(elementId);
    if(input){
        input.addEventListener('keyup', async () => {
            let value;
            if (input.tagName === "TEXTAREA") { 
                value = input.innerHTML;
            } else {
                value = input.value;
            }
            if(value){
                await configStorage.set(elementId, input.value);
            }
        });
        const value = await configStorage.get(elementId) || defaultValue;
        if(value){
            if (input.tagName === "TEXTAREA") { 
                input.innerHTML = value;
            }
            input.setAttribute('value', value);
        }
    }
}

