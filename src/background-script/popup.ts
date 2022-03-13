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
    prepareInput('time-between-interactions', config.timeBetweenInteractions.toString());
    prepareInput('variant-limit', config.limitOfVariants.toString());
    prepareInput('min-child-node-diff', config.minimumChildNodesNumberForDiff.toString());
    prepareInput('html-tags-for-diff', config.strHtmlTagsForDiff);
    prepareInput('max-wait-time-unload', config.maxWaitTimeForUnload.toString());
    prepareInput('int-cell-tolerance-percentage', config.interactableCellTolerancePercent.toString());
    prepareInput('consider-full-url', (config.considerFullUrl.map((url) => url.href)).join('\n'));
    
    const runningStatusStorage = new IndexedDBObjectStorage<boolean>(IndexedDBDatabases.RunningStatus, IndexedDBDatabases.RunningStatus);
    
    const startButton = <HTMLInputElement> document.getElementById('start');
    if(startButton){
        const status = await runningStatusStorage.get('status');
        startButton.value = status ? 'Stop' : 'Start';
        startButton.addEventListener('click', () => {
            startButton.value = status ? 'Start' : 'Stop';
            communicationChannel.sendMessage(new Message([Command.Start]));
        });
    }

    const language = <HTMLSelectElement> document.getElementById('language');
    if(language){
        language.value = config.language;
        language.addEventListener('change', async () => {
            var value = language.options[language.selectedIndex].value;
            if(value){
                await configStorage.set('language', value);
            }
        });
    }
});

async function prepareInput(elementId: string, defaultValue: string = ''){
    const input = <HTMLInputElement> document.getElementById(elementId);
    if(input){
        input.addEventListener('keyup', async () => {
            if(input.value){
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

