import { Command } from "../../../core/command";

export class UpdateRestaurant extends Command {
    public name: string;

    constructor(name: string, guuid?: string){
        super(guuid);
        this.name = name;
    }
}