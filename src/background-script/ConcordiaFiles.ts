import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Spec } from '../content-script/spec-analyser/Spec';
import { Feature } from '../content-script/spec-analyser/Feature';
import { getDictionary } from '../content-script/dictionary';
import { VariantSentenceType } from '../content-script/enums/VariantSentenceType';

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

		const space = ' ';
		const doubleSpaces = '  ';
		const spaceTab = '\t';
		const doubleSpaceTab = '\t\t';
		const doubleColon = ': ';
		const lineBreak = '\n';
		const doubleLineBreak = '\n\n';

		let content = '#language: ' + language + doubleLineBreak;

		content += dictionary.feature + doubleColon + feature.getName() + doubleLineBreak;

		content += dictionary.scenario + doubleColon + mainScenario.getName() + doubleLineBreak;

		for (let variant of mainScenario.getVariants()) {
			content += spaceTab + dictionary.variant + doubleColon + variant.getName() + lineBreak;

			const sentences = variant.getSentences();

			for (let sentence of sentences) {
				const sentenceTypeDictionary = dictionary.variantSentenceTypes[sentence.type];
				const sentenceActionDictionary = dictionary.variantSentenceActions[sentence.action];

				if (sentence.type === VariantSentenceType.AND) {
					content += spaceTab;
				}

				content +=
					doubleSpaceTab +
					sentenceTypeDictionary +
					space +
					dictionary.I +
					space +
					sentenceActionDictionary +
					space;

				if (sentence.type === VariantSentenceType.GIVEN) {
					content += '[' + sentence.url + ']' + lineBreak;
				} else if (sentence.type === VariantSentenceType.THEN) {
					content += '~' + sentence.statePostCondition + '~' + doubleLineBreak;
				} else {
					content += '{' + sentence.uiElement?.getName() + '}' + lineBreak;
				}
			}
		}

		for (let uiElm of feature.getUiElements()) {
			content += uiElm.getName() + lineBreak;
		}

		return content;
	}
}
