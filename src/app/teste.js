let exibirAlert = function(){
    alert("Cadastrado com sucesso");
}

let data = {};
data.local = window.location.href

//var all = document.body.getElementsByTagName("*");
document.querySelectorAll('*').forEach(function(node) {
    
    //FORM
    if(node.nodeName == "FORM"){
        data.variante = node.name; 
        
        let elementsForm = node.children;
        let countDivs = 0;

        for(let i in elementsForm){
            
            //DIV
            if(elementsForm[i].nodeName == "DIV"){
                
                countDivs++;
                let div =  elementsForm[i].children;
                for(let j=0; j < div.length; j++){

                    if(div[j].nodeName == "LABEL" && div[j + 1].nodeName == "INPUT"){
                        
                        if(countDivs == 1){
                            data.quando = "eu preencho {#" + div[j + 1].id + "}";
                        }
                        else{
                            data.quando += " \n\t\te eu preencho {#" + div[j + 1].id + "}";
                        }

                        j++
                    }
                }
            }
            
            //BUTTON
            if(elementsForm[i].nodeName == "BUTTON"){
                if(elementsForm[i].type == "submit"){
                    data.entao = "eu clico em {#" + elementsForm[i].id + "}";
                    data.entao += " \n\t\te eu vejo TESTE";
                }
            }
        }                
    }
});

console.log("template: \n", template);
let html = Mustache.render(template, data);
console.log("substituindo: \n", html);
let feature = document.getElementById("feature");

feature.innerHTML = html;