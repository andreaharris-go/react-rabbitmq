import { ensureConsumer, rabbitMqQueue, subscribeToMessages } from "@/lib/rabbitmq";

export const runtime = "nodejs";

type StreamEvent =
  | {
      type: "status";
      message: string;
    }
  | {
      type: "message";
      id: string;
      content: string;
      receivedAt: string;
    };

function serializeEvent(event: StreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET() {
  try {
    await ensureConsumer();
  } catch {
    return Response.json(
      {
        error: "Unable to connect to RabbitMQ. Check RABBITMQ_URL and make sure the broker is running.",
      },
      { status: 500 },
    );
  }

  const encoder = new TextEncoder();
  let cleanup = () => {};
  let keepAlive: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(serializeEvent(event)));
      };

      cleanup = subscribeToMessages((message) => {
        send(message);
      });

      send({
        type: "status",
        message: `Connected to RabbitMQ queue \"${rabbitMqQueue()}\".`,
      });

      keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 15000);
    },
    cancel() {
      cleanup();
      if (keepAlive) {
        clearInterval(keepAlive);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}
