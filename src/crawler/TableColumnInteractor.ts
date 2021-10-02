import { ElementInteraction } from './ElementInteraction';
import { ElementInteractor } from './ElementInteractor';
import { InteractionResult } from './InteractionResult';

export class TableColumnInteractor implements ElementInteractor<HTMLTableColElement> {
	public async execute(
		interaction: ElementInteraction<HTMLTableColElement>
	): Promise<InteractionResult> {
		const element = interaction.getElement();

		element.click();

		return new InteractionResult(false);
	}
}
