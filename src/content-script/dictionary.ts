const dictionary = {
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
			'Submit',
		],
		stringsCancelButtons: ['Cancel', 'Back', 'Close', 'Return', 'No'],
		stringLogoutButtons: ['Logout', 'Exit'],
	},
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
			'Confirma',
			'Salvar',
			'Salva',
			'Gravar',
			'Grava',
			'Concluir',
			'Conclui',
			'Finalizar',
			'Finaliza',
			'Armazenar',
			'Armazena',
			'Cadastrar',
			'Cadastra',
			'Gerar',
			'Gera',
			'Registrar',
			'Registra',
			'Manter',
			'Mantém',
			'Mantem',
			'Listar',
			'Lista',
			'Pesquisar',
			'Pesquisa',
			'Sim',
		],
		stringsCancelButtons: [
			'Cancelar',
			'Cancela',
			'Voltar',
			'Volta',
			'Fechar',
			'Fecha',
			'Retornar',
			'Retorna',
			'Não',
		],
		stringLogoutButtons: ['Sair', 'Encerrar'],
	},
};

dictionary.pt.stringsFinalActionButtons = dictionary.pt.stringsFinalActionButtons.concat(
	dictionary.en.stringsFinalActionButtons
);
dictionary.pt.stringsCancelButtons = dictionary.pt.stringsCancelButtons.concat(
	dictionary.en.stringsCancelButtons
);
dictionary.pt.stringLogoutButtons = dictionary.pt.stringLogoutButtons.concat(
	dictionary.en.stringLogoutButtons
);

export function getDictionary(language?: string) {
	switch (language) {
		case 'pt':
			return dictionary.pt;
		case 'en':
			return dictionary.en;
		default:
			return dictionary.en;
	}
}
