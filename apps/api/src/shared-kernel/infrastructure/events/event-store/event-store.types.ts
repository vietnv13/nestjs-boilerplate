export interface StoredEvent {
  id: string;
  aggregateId: string;
  eventType: string;
  eventData: any;
  metadata: {
    timestamp: Date;
    version: number;
    userId?: string;
  };
  createdAt: Date;
}

export interface EventFilter {
  aggregateId?: string;
  eventType?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
}
