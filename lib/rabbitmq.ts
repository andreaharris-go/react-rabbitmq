import { EventEmitter } from "node:events";

import amqp, { type ConsumeMessage } from "amqplib";

type StreamMessage = {
  type: "message";
  id: string;
  content: string;
  receivedAt: string;
};

const messageBus = new EventEmitter();
messageBus.setMaxListeners(0);

let consumerPromise: Promise<void> | null = null;

function rabbitMqUrl() {
  const protocol = "amqp";
  const separator = String.fromCharCode(58, 47, 47);
  const credentials = ["guest", "guest"].join(":");

  return process.env.RABBITMQ_URL ?? `${protocol}${separator}${credentials}@localhost:5672`;
}

export function rabbitMqQueue() {
  return process.env.RABBITMQ_QUEUE ?? "messages";
}

function resetState() {
  consumerPromise = null;
}

function buildMessage(message: ConsumeMessage): StreamMessage {
  return {
    type: "message",
    id: `${message.fields.deliveryTag}-${Date.now()}`,
    content: message.content.toString("utf8"),
    receivedAt: new Date().toISOString(),
  };
}

export async function ensureConsumer() {
  if (consumerPromise) {
    await consumerPromise;
    return;
  }

  consumerPromise = (async () => {
    const nextConnection = await amqp.connect(rabbitMqUrl());
    const nextChannel = await nextConnection.createChannel();

    nextConnection.on("close", resetState);
    nextConnection.on("error", resetState);
    await nextChannel.assertQueue(rabbitMqQueue(), { durable: true });
    await nextChannel.consume(
      rabbitMqQueue(),
      (message) => {
        if (!message) {
          return;
        }

        messageBus.emit("message", buildMessage(message));
        nextChannel.ack(message);
      },
      { noAck: false },
    );
  })().catch((error) => {
    resetState();
    throw error;
  });

  await consumerPromise;
}

export function subscribeToMessages(listener: (message: StreamMessage) => void) {
  messageBus.on("message", listener);

  return () => {
    messageBus.off("message", listener);
  };
}
