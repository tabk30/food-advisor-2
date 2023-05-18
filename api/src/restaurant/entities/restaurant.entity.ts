import moment from 'moment';
import { v4 } from 'uuid';
export class Restaurant {
    id: string;
    timestamp: number;
    name: string;
    constructor(name: string){
        this.id = v4();
        this.name = name;
        this.timestamp = moment().valueOf();
    }
}
