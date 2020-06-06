import { EditableTypes } from "./types/EditableTypes";
import { DataTypes } from "./types/DataTypes";
import { PropertyTypes } from "./types/PropertyTypes";

export class UIProperty {	 
    private name!: string;
    private value: any;

    constructor(name : string, value: any) {
        this.setName(name);
        this.setValue(value);
    }

    //name
    public setName(name : string){
        
        if(name == PropertyTypes.TYPE){
            if(this.value == DataTypes.DATE){
                name = "dataType"
            }
        }

        this.name = name;
    }

    public getName(){
        return this.name;
    }

    //value
    public setValue(value : any){
        
        if(this.name == PropertyTypes.TYPE){
            
            if(value == 'text' || value == 'textbox'){
                value = EditableTypes.TEXTBOX;
            }

            if(Object.values(EditableTypes).includes(value)){
                this.value = value;
            }

        } else if (this.name == PropertyTypes.DATATYPE){
            
            if(value == 'text'){
                this.value = DataTypes.STRING;
            } else if(value == 'datetime-local'){
                this.value = DataTypes.DATETIME;
            }

            if(Object.values(DataTypes).includes(value)){
                this.value = value;
            }
            
        } else {
            this.value = value;
        }
    }

    public getValue(){
        return this.value;
    }
}