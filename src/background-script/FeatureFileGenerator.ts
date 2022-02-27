import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Feature } from '../content-script/spec-analyser/Feature';
import { getDictionary } from '../content-script/dictionary';
import { VariantSentenceType } from '../content-script/enums/VariantSentenceType';
import { VariantSentenceActions } from '../content-script/enums/VariantSentenceActions';
import { Scenario } from '../content-script/spec-analyser/Scenario';
import { UIElement } from '../content-script/spec-analyser/UIElement';
import { PropertyTypes } from '../content-script/enums/PropertyTypes';
import { formatToFirstCapitalLetter } from '../content-script/util';

const spaceTab = '\t';
const doubleSpaceTab = '\t\t';
const lineBreak = '\n';
const doubleLineBreak = '\n\n';

export class FeatureFileGenerator {
	public async generate(spec) {
		const zip = new JSZip();

		console.log('getFeatures', spec.getFeatures())
		for (let feature of spec.getFeatures()) {
			const fileContent = await this.generateFeatureFile(feature, spec.language);
			
			let folderName = feature.url ? feature.url.pathname : '';

			if(folderName){
				let folderNameArr = folderName.split('.')[0].split('/').filter((position) => position != '');
				folderName = folderNameArr.join('/');
			}

			const fileName = feature.getName().toLowerCase() + '.feature';
			const pathFile = folderName ? folderName + '/' + fileName : fileName; 

			zip.file(pathFile, fileContent);
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
		content = await this.generateVariants(content, mainScenario, dictionary, feature?.url);

		// uiElements
		content = await this.generateUiElements(content, feature.getUiElements(), dictionary);

		return content;
	}

	private async generateVariants(
		content: string,
		scenario: Scenario,
		dictionary,
		url: URL | undefined
	): Promise<string> {
		const urlStr = url && url.href ? url.href : '';

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

				content += doubleSpaceTab + `${sentenceTypeDictionary} `;

				if (sentence.type === VariantSentenceType.GIVEN) {
					content += `${dictionary.that} `;
				}

				content += `${dictionary.I} ${sentenceActionDictionary} `;

				if (sentence.type === VariantSentenceType.GIVEN) {
					content += `${dictionary.inThe} "${urlStr}"` + lineBreak;
				} else if (sentence.type === VariantSentenceType.THEN) {
					content += `~${sentence.statePostCondition}~` + doubleLineBreak;
				} else {
					if (sentence.action === VariantSentenceActions.CLICK) {
						content += `${dictionary.inThe} `;
					}

					let innerTextValue = sentence.uiElement?.getInnexTextValue();

					content += innerTextValue
						? `"${innerTextValue}"`
						: `{${sentence.uiElement?.getName()}}`;

					content += lineBreak;
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
		for (let i in uiElements) {
			let uiElm = uiElements[i];

			if(!uiElm.onlyDisplayValue){
				let uiElmName = uiElm.getName() != '' ? uiElm.getName() : formatToFirstCapitalLetter(dictionary.element) + ' ' + i;

				content += `${dictionary.uiElement}: ${uiElmName}` + lineBreak;
	
				for (let property of uiElm.getProperties()) {
					let propName = property.getName();
	
					const propertyNameDictionary =
						dictionary.uiElmPropertiestypes[propName.toLocaleLowerCase()];
	
					let value = property.getValue();
	
					if (
						propName === PropertyTypes.FORMAT ||
						(propName === PropertyTypes.VALUE && typeof value === 'string')
					) {
						value = `'${value}'`;
					} else if (propName === PropertyTypes.ID) {
						value = property.isXPathIdProp() ? `'//${value}'` : `'#${value}'`;
					}

					if(propName === PropertyTypes.EDITABLE || propName === PropertyTypes.REQUIRED){
						content += spaceTab + '- ' + propertyNameDictionary + lineBreak;
					} else {
						content +=
							spaceTab + `- ${propertyNameDictionary} ${dictionary.is} ${value}` + lineBreak;
					}
				}
	
				content += lineBreak;
			}
		}

		return content;
	}
}
