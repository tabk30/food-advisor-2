import { Command } from "../../../core/command";

export class CreateRestaurantCommand extends Command {
    name: string;
    constructor(name: string, guid?: string) {
        super(guid);
        this.name = name;
    }
}