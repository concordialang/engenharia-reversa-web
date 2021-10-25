export class InteractionResult {
	private triggeredRedirection: boolean;

	constructor(triggeredRedirection: boolean) {
		this.triggeredRedirection = triggeredRedirection;
	}

	public getTriggeredRedirection(): boolean {
		return this.triggeredRedirection;
	}
}
