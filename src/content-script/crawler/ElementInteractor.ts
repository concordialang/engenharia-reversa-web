import { ElementInteraction } from './ElementInteraction';
import { InteractionResult } from './InteractionResult';

export interface ElementInteractor<T extends HTMLElement> {
	execute(
		interaction: ElementInteraction<T>,
		redirectionCallback?: (interaction: ElementInteraction<HTMLElement>) => Promise<void>
	): Promise<InteractionResult>;
}
