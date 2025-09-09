export interface IMessageBroker {
  subscribe(channel: string, callback: (message: any) => Promise<void>): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}