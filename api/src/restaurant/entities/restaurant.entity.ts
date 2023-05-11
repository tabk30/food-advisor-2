import { AggregateRoot } from './../../core/aggregate-root';
import { RestaurantCreatedEvent } from '../events/RestaurantCreate';
import { RestaurantUpdatedEvent } from '../events/RestaurantUpdate';

export class Restaurant extends AggregateRoot {
    public restaurant_id: string;
    public name: string
    public tableName: string = process.env.RETAURANT_TABLE_NAME ? process.env.RETAURANT_TABLE_NAME : 'restaurants';

    constructor();

    constructor(guid: string, name: string);

    constructor(guid?: string, name?: string) {
        super(guid);

        if (guid && name) {
            this.applyChange(new RestaurantCreatedEvent(guid, name));
        }
    }

    updateInfo(name: string) {
        this.applyChange(new RestaurantUpdatedEvent(this.guid, name));
    }

    applyRestaurantCreatedEvent(event: RestaurantCreatedEvent) {
        this.guid = event.guid;
        this.name = event.name;
    }

    applyRestaurantUpdatedEvent(event: RestaurantUpdatedEvent) {
        this.name = event.name;
    }
}
