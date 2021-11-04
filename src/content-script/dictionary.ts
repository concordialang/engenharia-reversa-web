const dictionary = {
	pt: {
		feature: 'Funcionalidade',
		scenario: 'Cenário',
		scenarioDefaultName: 'Cenário Geral',
		variant: 'Variante',
		variantSentence: 'Sentença de Variante',
		uiElement: 'Elemento de Interface de Usuário',
		state: 'Estado',
		constant: 'Constante',
		stringsFinalActionButtons: [
			'Confirmar',
			'Salvar',
			'Gravar',
			'Concluir',
			'Finalizar',
			'Armazenar',
			'Cadastrar',
			'Gerar',
			'Registrar',
			'Manter',
			'Sim',
			'Listar',
			'Pesquisar',
		],
		stringsCancelButtons: ['Cancelar', 'Voltar', 'Fechar', 'Retornar', 'Não'],
	},
	en: {
		feature: 'Feature',
		scenario: 'Scenario',
		scenarioDefaultName: 'General Scenario',
		variant: 'Variant',
		variantSentence: 'Variant Sentence',
		uiElement: 'User Interface Element',
		state: 'State',
		constant: 'Constant',
		stringsFinalActionButtons: [
			'Confirm',
			'Save',
			'Record',
			'Conclude',
			'Finish',
			'Store',
			'Register',
			'Generate',
			'Maintain',
			'Ok',
			'Yes',
			'List',
			'Search',
		],
		stringsCancelButtons: ['Cancel', 'Back', 'Close', 'Return', 'No'],
	},
};

dictionary.pt.stringsFinalActionButtons = dictionary.pt.stringsFinalActionButtons.concat(
	dictionary.en.stringsFinalActionButtons
);
dictionary.pt.stringsCancelButtons = dictionary.pt.stringsCancelButtons.concat(
	dictionary.en.stringsCancelButtons
);

export function getDictionary(language: string) {
	switch (language) {
		case 'pt':
			return dictionary.pt;
		case 'en':
			return dictionary.en;
		default:
			return dictionary.en;
	}
}
