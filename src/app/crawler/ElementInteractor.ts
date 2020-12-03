import { ElementInteraction } from './ElementInteraction';

export interface ElementInteractor<T extends HTMLElement> {
	execute(interaction: ElementInteraction<T>): void;
}
