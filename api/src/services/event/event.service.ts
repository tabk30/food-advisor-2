// import { ConcurrencyException, NotFoundException } from './Errors';
import { DynamodbService } from './../dynamodb/dynamodb.service';
import { EventDescriptor } from '../../core/event-descriptor';
import { IEvent } from '../../core/interfaces/i-event';
import { IEventStore } from '../../core/interfaces/i-event-store';
import { createEventDescriptor, rehydrateEventFromDescriptor } from './utilities/EventProcessor';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EventService implements IEventStore {
  constructor(
    private readonly dynamoDB: DynamodbService
  ) {}

  async saveEvents(agreegateTableName: string, aggregateGuid: string, events: IEvent[], expectedVersion: number) {
    console.log("EventService saveEvents", agreegateTableName, aggregateGuid, events, expectedVersion)
    const operations: EventDescriptor[] = [];

    const latestEvent = await this.getLastEventDescriptor(aggregateGuid);
    console.log("EventService saveEvents", latestEvent)
    if (latestEvent && latestEvent.version !== expectedVersion && expectedVersion !== -1) {
    //   throw new ConcurrencyException('Cannot perform the operation due to internal conflict');
    }

    let i: number = expectedVersion;

    for (const event of events) {
      i++;
      event.version = i;
      const eventDescriptor = createEventDescriptor(event);
      console.log("saveEvents send to event bus", event.aggregateName, eventDescriptor)
      
      operations.push(eventDescriptor);
    }

    await this.dynamoDB.saveEvents(agreegateTableName, operations);
  }

  async getEventsForAggregate(aggregateGuid: string): Promise<IEvent[]> {
    // const events = await this.eventCollection.find({ aggregateGuid }).toArray();
    // if (!events.length) {
    // //   throw new NotFoundException('Aggregate with the requested Guid does not exist');
    // }
    // return events.map((eventDescriptor: EventDescriptor) => rehydrateEventFromDescriptor(eventDescriptor));
    return []
  }

  private async getLastEventDescriptor(aggregateGuid: string): Promise<any> {
    // const [latestEvent] = await this.eventCollection.find({ aggregateGuid }, { sort: { _id: -1 } }).toArray();
    return ;
  }
}