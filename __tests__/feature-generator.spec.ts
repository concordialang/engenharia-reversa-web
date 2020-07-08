import { SpecAnalyzer } from '../src/app/analysis/SpecAnalyzer';
import { Spec } from '../src/app/analysis/Spec';
import clearElement from '../src/util/clear-element';

describe('FeatureGenerator', () => {
	let specAnalyzer: SpecAnalyzer;

	beforeEach(() => {
		specAnalyzer = new SpecAnalyzer();
	});

	afterEach(() => {
		clearElement(document.body);
	});

	it('detects feature default', () => {
		const html = `
            <h1>Cadastro de Cliente</h1>
            <form id="formulario" name="Cadastro" method="post">
                <div id="cadastroNomeCompleto">
                    <label for="nome">Nome:</label>
                    <input type="text" id="nome" name="nome" required>
                    <label for="sobrenome">Sobrenome:</label>
                    <input type="text" id="sobrenome" name="sobrenome" required>
                </div>
                <div id="cadastroTelefones">
                    <label for="telefone">Telefone Fixo:</label>
                    <input type="text" id="telefone" name="telefonefix" min="6" max="50">
                    <label for="celular">Celular:</label>
                    <input type="text" id="celular" name="celular" min="6" max="50">
                </div>
            </form>`;

		document.body.innerHTML = html;
		const spec = new Spec('pt-br');
		const specAnalyzed = specAnalyzer.analyze(document.body, spec);
		const feature = specAnalyzed.features[0];

		expect(feature?.scenarios).toHaveLength(2);
		expect(feature?.scenarios[0].getVariants()).toHaveLength(1);
		expect(feature?.scenarios[1].getVariants()).toHaveLength(1);
		expect(
			feature?.scenarios[0].getVariants()[0].getSentences()
		).toHaveLength(4);
		expect(
			feature?.scenarios[1].getVariants()[0].getSentences()
		).toHaveLength(2);
		expect(feature?.uiElements).toHaveLength(4);
	});

	it('detects feature with fieldset, select and textarea', () => {
		const html = `
            <fieldset>
                <legend>Cadastro de Cliente</legend>
                <form id="formulario" name="Cadastro" method="post">
                    <input type="text" id="foo" name="Foo">
                    <input type="text" id="foo2" name="Foo2">
                    <textarea id="textareatest" name="TextAreaTest" rows="4" cols="50" required></textarea>
                    <select id="cars">
                        <option value="volvo" required>Volvo</option>
                        <option value="saab">Saab</option>
                        <option value="mercedes">Mercedes</option>
                        <option value="audi">Audi</option>
                    </select>
                </form>
            </fieldset>`;

		document.body.innerHTML = html;
		const spec = new Spec('pt-br');
		const specAnalyzed = specAnalyzer.analyze(document.body, spec);
		const feature = specAnalyzed.features[0];

		expect(feature?.scenarios).toHaveLength(2);
		expect(feature?.scenarios[0].getVariants()).toHaveLength(1);
		expect(feature?.scenarios[1].getVariants()).toHaveLength(1);
		expect(feature?.uiElements).toHaveLength(4);
	});
});
