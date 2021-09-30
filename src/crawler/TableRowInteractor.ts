import { HTMLEventType } from '../types/HTMLEventType';
import { sleep } from '../util';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractor } from './ElementInteractor';
import { InteractionResult } from './InteractionResult';

export class TableRowInteractor implements ElementInteractor<HTMLTableRowElement> {
	public async execute(
		interaction: ElementInteraction<HTMLTableRowElement>
	): Promise<InteractionResult> {
		const element = interaction.getElement();

		element.click();

		return new InteractionResult(true);
	}
}
