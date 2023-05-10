import { v4 } from 'uuid';
import { ICommand } from "./interfaces/i-command";

export class Command implements ICommand {
    guid: string;
    constructor(guid?: string){
        this.guid = guid || v4();
    }
}