import { attribute, hashKey, rangeKey, table } from '@aws/dynamodb-data-mapper-annotations';
import * as moment from 'moment';
import { v4 } from 'uuid';

@table('restaurant')
export class Restaurant {
    @hashKey({ defaultProvider: () => v4() })
    restaurant_id: string;

    @rangeKey({ defaultProvider: () => moment().valueOf() })
    created_at_ts: number

    @attribute()
    name: string
}
