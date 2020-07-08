import { AppEvent } from './AppEvent';
import { Command } from './Command';

export class Message {
	private actions: Array<Command> | Array<AppEvent>;
	private extra?: any;

	constructor(actions: Array<Command> | Array<AppEvent>, extra?: any) {
		this.actions = actions;
		this.extra = extra;
	}

	public getActions(): Array<Command> | Array<AppEvent> {
		return this.actions;
	}

	public getExtra(): any | undefined {
		return this.extra;
	}

	public includesAction(action: Command | AppEvent) {
		for (const a of this.actions) {
			if (a == action) return true;
		}
		return false;
	}
}
