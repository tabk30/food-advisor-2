import { IEvent } from "./i-event";

export interface IEventStore<T = any>{
    saveEvents(agreegateTableName: string, aggregateGuid: string, eventHistory: IEvent[], verstion: number): void;
    getEventsForAggregate(aggregateGuid: string): Promise<IEvent[]>;
}