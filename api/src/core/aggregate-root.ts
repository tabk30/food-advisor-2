import { v4 } from 'uuid';
import { IEvent } from "./interfaces/i-event";
export abstract class AggregateRoot {
    [x: string]: any;
    public guid: string;
    private __version: number = -1;
    private __changes: any[] = [];

    get version (): number {
        return this.__version;
    }

    constructor(guid?: string) {
        this.guid = guid || v4();
    }

    public getUncommittedEvents(): IEvent[] {
        return this.__changes;
    }

    public markChangesAsCommites(): void {
        this.__changes = [];
    }

    protected applyChange(event: IEvent) {
        this.applyEvent(event, true);
    }

    private applyEvent(event: IEvent, isNew = false) {
        this[`apply${event.eventName}`](event);
        if (isNew) this.__changes.push(event);
    }

    public loadFromHistory(events: IEvent[]) {
        for (const event of events) {
            this.applyEvent(event);
            this.__version++;
        }
    }
}