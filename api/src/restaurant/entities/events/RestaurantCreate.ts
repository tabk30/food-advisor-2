import { Event } from "../../../core/event";

export class RestaurantCreated extends Event {
    public eventName: string = RestaurantCreated.name;
    public aggregateName: string = 'restaurant';

    constructor(public guid: string, public name: string) {
        super(guid);
      }
}