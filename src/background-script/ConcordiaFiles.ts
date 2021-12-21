import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Spec } from '../content-script/spec-analyser/Spec';
import { Feature } from '../content-script/spec-analyser/Feature';
import { getDictionary } from '../content-script/dictionary';
import { VariantSentenceType } from '../content-script/enums/VariantSentenceType';
import { VariantSentenceActions } from '../content-script/enums/VariantSentenceActions';
import { Scenario } from '../content-script/spec-analyser/Scenario';
import { UIElement } from '../content-script/spec-analyser/UIElement';

const spaceTab = '\t';
const doubleSpaceTab = '\t\t';
const lineBreak = '\n';
const doubleLineBreak = '\n\n';

export class ConcordiaFiles {
	public async gerate(spec) {
		const zip = new JSZip();

		for (let feature of spec.getFeatures()) {
			const contentFile = await this.generateFeatureFile(feature, spec.language);

			zip.file(feature.getName().toLowerCase() + '.feature', contentFile);
		}

		zip.generateAsync({ type: 'blob' }).then((content) => {
			saveAs(content, 'specConcordia.zip');
		});
	}

	private async generateFeatureFile(feature: Feature, language: string): Promise<string> {
		const dictionary = getDictionary(language);

		const mainScenario = feature.getGeneralScenario();

		let content = `#${dictionary.language}: ${language}` + doubleLineBreak;

		// feature
		content += `${dictionary.feature}: ${feature.getName()}` + doubleLineBreak;

		// scenario
		content += `${dictionary.scenario}: ${mainScenario.getName()}` + doubleLineBreak;

		// variants
		content = await this.generateVariants(content, mainScenario, dictionary);

		// uiElements
		content = await this.generateUiElements(content, feature.getUiElements(), dictionary);

		return content;
	}

	private async generateVariants(
		content: string,
		scenario: Scenario,
		dictionary
	): Promise<string> {
		// variants
		for (let variant of scenario.getVariants()) {
			content += spaceTab + `${dictionary.variant}: ${variant.getName()}` + lineBreak;

			const sentences = variant.getSentences();

			// variant sentences
			for (let sentence of sentences) {
				const sentenceTypeDictionary = dictionary.variantSentenceTypes[sentence.type];
				const sentenceActionDictionary = dictionary.variantSentenceActions[sentence.action];

				if (sentence.type === VariantSentenceType.AND) {
					content += spaceTab;
				}

				// content += doubleSpaceTab + `${sentenceTypeDictionary} ${sentence.type === VariantSentenceType.GIVEN ? dictionary.that : ''} ${dictionary.I} ${sentenceActionDictionary} `;
				content += doubleSpaceTab + `${sentenceTypeDictionary} `;

				if (sentence.type === VariantSentenceType.GIVEN) {
					content += `${dictionary.that} `;
				}

				content += `${dictionary.I} ${sentenceActionDictionary} `;

				if (sentence.type === VariantSentenceType.GIVEN) {
					content += `${dictionary.inThe} [${sentence.url}]` + lineBreak;
				} else if (sentence.type === VariantSentenceType.THEN) {
					content += `~${sentence.statePostCondition}~` + doubleLineBreak;
				} else {
					if (sentence.action === VariantSentenceActions.CLICK) {
						content += ` ${dictionary.on} `;
					}

					content += `{${sentence.uiElement?.getName()}}` + lineBreak;
				}
			}
		}

		return content;
	}

	private async generateUiElements(
		content: string,
		uiElements: UIElement[],
		dictionary
	): Promise<string> {
		for (let uiElm of uiElements) {
			content += `${dictionary.uiElement}: ${uiElm.getName()}` + lineBreak;

			for (let property of uiElm.getProperties()) {
				content +=
					spaceTab +
					`- ${property.getName()} ${dictionary.is} ${property.getValue()}` +
					lineBreak;
			}

			content += lineBreak;
		}

		return content;
	}
}
