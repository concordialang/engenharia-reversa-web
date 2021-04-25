import { Util } from '../Util';
import { Extension } from './Extension';

export class CodeChangeMonitor {
	private extension: Extension;
	private lastModifiedDate: Date | null;

	constructor(extension: Extension) {
		this.extension = extension;
		this.lastModifiedDate = null;
	}

	public async checkForModification(callback: Function) {
		while (true) {
			await Util.sleep(5);
			const wasModified = await this.wasCodeModified();
			if (wasModified) {
				callback();
			}
		}
	}

	private wasCodeModified(): Promise<boolean> {
		const _this = this;
		return new Promise((resolve) => {
			_this.extension.getFileSystemEntry('reload').then(function (file) {
				file.getMetadata(function (metadata) {
					if (!_this.lastModifiedDate) {
						_this.lastModifiedDate = metadata.modificationTime;
					} else if (metadata.modificationTime > _this.lastModifiedDate) {
						_this.lastModifiedDate = metadata.modificationTime;
						resolve(true);
					}
					resolve(false);
				});
			});
		});
	}
}
