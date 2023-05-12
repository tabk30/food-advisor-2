import { v4 } from 'uuid';

export const EventType = {
  CREATED: 'CREATED',
  WITHDRAW: 'WITHDRAW',
  CREDIT: 'CREDIT',
  SNAPSHOT: 'SNAPSHOT'
}

export class Account {
    public id: string;
    public name: string;
    public balance: number;
    constructor(id: string, name: string, balance: number){
        this.id = id;
        this.name = name;
        this.balance = balance;
    }
}
