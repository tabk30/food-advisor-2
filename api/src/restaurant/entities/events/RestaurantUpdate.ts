import { Event } from "../../../core/event";

export class RestaurantUpdated extends Event {
    public eventName: string = RestaurantUpdated.name;
    public aggregateName: string = 'restaurant';

    constructor(public guid: string, public name: string) {
        super(guid);
      }
}