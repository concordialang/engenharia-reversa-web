import { UIProperty } from "./UIProperty";

export class UIElement {
	private name!: string;
    private properties!: Array< UIProperty >;

    constructor(){
        this.name = "";
        this.properties = new Array;
    }

    //name
    public setName(name : string){
        this.name = name;
    }

    public getName(){
        return this.name;
    }

    //properties
    public setProperty(property : UIProperty){
        this.properties.push(property);
    }

    public setProperties(properties : Array< UIProperty >){
        this.properties = properties;
    }

    public getProperties(){
        return this.properties;
    }
}