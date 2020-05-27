import { Command } from "./Command";
import { AppEvent } from "./AppEvent";

export class Message {

    private actions : Array<Command>|Array<AppEvent>;
    private extra? : Object

    constructor(actions : Array<Command>|Array<AppEvent>, extra? : Object){
        this.actions = actions;
        this.extra = extra;
    }

    public getActions(): Array<Command>|Array<AppEvent> {
        return this.actions;
    }

    public getExtra(): Object | undefined {
        return this.extra;
    }
    
}