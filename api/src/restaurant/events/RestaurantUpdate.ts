import { Event } from "../../core/event";

export class RestaurantUpdatedEvent extends Event {
  public eventName: string = RestaurantUpdatedEvent.name;
  public aggregateName: string = 'restaurant';

  constructor(public guid: string, public name: string) {
    super(guid);
  }
}