import { Event } from "../../core/event";

export class RestaurantCreatedEvent extends Event {
  public eventName: string = RestaurantCreatedEvent.name;
  public aggregateName: string = 'restaurant';

  constructor(public guid: string, public name: string) {
    super(guid);
  }
}