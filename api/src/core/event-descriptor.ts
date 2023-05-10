export class EventDescriptor {
  constructor(
    public readonly aggregateGuid: string,
    public readonly aggregateName: string,
    public readonly eventName: string,
    public readonly payload: Record<string, any>,
    public readonly version: number
  ) {}
}
