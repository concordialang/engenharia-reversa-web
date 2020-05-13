import { Tab } from "./Tab";

export class ChromeTab implements Tab {

    private id : string;

    constructor(id : string){
        this.id = id;
    }

    public getId() : string{
        return this.id;
    }

}