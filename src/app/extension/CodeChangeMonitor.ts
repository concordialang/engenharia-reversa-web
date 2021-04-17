import { Extension } from './Extension';

export class CodeChangeMonitor {

    private extension : Extension;
    private lastModifiedDate : Date|null;

    constructor(extension : Extension) {
        this.extension = extension;
        this.lastModifiedDate = null;
    }

    public checkForModification() : Promise<void> {
        const _this = this;
        return new Promise((resolve) => {
            function checkForModificationRecursion(){
                _this.extension.getFileSystemEntry("reload").then(function(file){
                    file.getMetadata(function(metadata){
                        if(!_this.lastModifiedDate){
                            _this.lastModifiedDate = metadata.modificationTime;
                        } else if(metadata.modificationTime > _this.lastModifiedDate){
                            _this.lastModifiedDate = metadata.modificationTime;
                            resolve();
                        }
                        checkForModificationRecursion();
                    })
                });
            }
            checkForModificationRecursion();
        });
    }

}