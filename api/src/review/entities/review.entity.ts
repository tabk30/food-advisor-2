import moment from "moment";
import { v4 } from 'uuid';
export class Review {
    id: string;
    sort: number;
    restaurant_id: string;
    account_id: string;
    content: string;
    timestamp: number;
    constructor(restaurant_id: string, account_id: string, content: string){
        this.id = v4();
        this.sort = 0;
        this.account_id= account_id;
        this.content = content;
        this.timestamp = moment().valueOf();
        this.restaurant_id = restaurant_id;
    }
}
