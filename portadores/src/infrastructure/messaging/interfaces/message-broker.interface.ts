export interface IMessageBroker {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish(channel: string, message: any): Promise<void>;
  subscribe(
    channel: string,
    callback: (message: any) => Promise<void>,
  ): Promise<void>;
}