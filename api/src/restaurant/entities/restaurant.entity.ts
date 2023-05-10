import { AggregateRoot } from './../../core/aggregate-root';
import { RestaurantCreated } from './events/RestaurantCreate';
import { RestaurantUpdated } from './events/RestaurantUpdate';

export class Restaurant extends AggregateRoot {
    public restaurant_id: string;
    public name: string
    public tableName: string = process.env.RETAURANT_TABLE_NAME ? process.env.RETAURANT_TABLE_NAME : 'restaurants';

    constructor();

    constructor(guid: string, name: string);

    constructor(guid?: string, name?: string) {
        super(guid);

        if (guid && name) {
            this.applyChange(new RestaurantCreated(guid, name));
        }
    }

    updateInfo(name: string) {
        this.applyChange(new RestaurantUpdated(this.guid, name));
    }

    applyRestaurantCreated(event: RestaurantCreated) {
        console.log("applyRestaurantCreated", event)
        this.guid = event.guid;
        this.name = event.name;
    }

    applyJobUpdated(event: RestaurantUpdated) {
        this.name = event.name;
    }
}
