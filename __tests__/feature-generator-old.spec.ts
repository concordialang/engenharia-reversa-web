import { FeatureGenerator } from "../src/app/feature-generators/FeatureGenerator";
import clearElement from "../src/util/clear-element";

describe( 'FeatureGenerator', () => {

    let generator: FeatureGenerator;

    beforeEach( () => {
        generator = new FeatureGenerator();
    } );

    afterEach( () => {
        clearElement( document.body );
    } );

    it( 'detects feature', () => {
        const html = `
            <form id="formulario" name="Cadastro" method="post">
                <h1>Cadastro de Cliente</h1>

                <div id="cadastroNomeCompleto">
                    <label for="nome">Nome:</label>
                    <input type="text" id="nome" name="nome">
                    <label for="sobrenome">Sobrenome:</label>
                    <input type="text" id="sobrenome" name="sobrenome">
                </div>

                <div id="cadastroTelefones">
                    <label for="telefone">Telefone Fixo:</label>
                    <input type="text" id="telefone" name="telefonefix" min="6" max="50">
                    <label for="celular">Celular:</label>
                    <input type="text" id="celular" name="celular" min="6" max="50">
                </div>
            </form>`;
        
        document.body.innerHTML = html;
        
        const feature = generator.fromElement( document.body );
        expect( feature?.scenarios ).toHaveLength( 2 );
        expect( feature?.scenarios[0].getVariants() ).toHaveLength( 2 );
        expect( feature?.scenarios[1].getVariants() ).toHaveLength( 2 );
        expect( feature?.uiElements ).toHaveLength( 4 );
    } );
} );