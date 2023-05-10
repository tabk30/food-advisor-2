import { AggregateRoot } from "./aggregate-root";
import { IEventStore } from "./interfaces/i-event-store";
import { IRepository } from "./interfaces/i-repository";

export class EventSourceRepository<T extends AggregateRoot> implements IRepository<T> {
    constructor(
        private readonly eventStore: IEventStore,
        private readonly Type: { new(): T }
    ) { }

    async save(aggregateRoot: T, expectedVersion: number) {
        await this.eventStore.saveEvents(aggregateRoot.tableName, aggregateRoot.guid, aggregateRoot.getUncommittedEvents(), expectedVersion);
        aggregateRoot.markChangesAsCommites();
    }

    async getById(guid: string) {
        const aggregateRoot = new this.Type() as T;
        const history = await this.eventStore.getEventsForAggregate(guid);
        aggregateRoot.loadFromHistory(history);
        return aggregateRoot;
    }

}