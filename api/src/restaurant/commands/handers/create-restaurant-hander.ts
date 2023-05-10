import { ICommandHander } from "@src/src/core/interfaces/i-command-hander";
import { Restaurant } from "../../entities/restaurant.entity";

import { CreateRestaurantCommand } from "../definitions/create-restaurant";
import { RestaurantService } from "../../restaurant.service";

export class CreateRestaurantHander implements ICommandHander<Restaurant> {
    commandTohander: string = CreateRestaurantHander.name;
    constructor(private readonly _repository: RestaurantService) {}
    async hander(command: CreateRestaurantCommand) {
        console.log("CreateRestaurantHander", command);
        const job: Restaurant = new Restaurant(command.guid, command.name);
        await this._repository.save(job, -1);
        return { guid: command.guid };
    }
}