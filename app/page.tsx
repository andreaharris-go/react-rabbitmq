"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

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

type MessageItem = Extract<StreamEvent, { type: "message" }>;

const MAX_MESSAGES = 20;

export default function Home() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [status, setStatus] = useState("Connecting to RabbitMQ stream...");

  useEffect(() => {
    const source = new EventSource("/api/messages");

    source.onmessage = (event) => {
      const data = JSON.parse(event.data) as StreamEvent;

      if (data.type === "status") {
        setStatus(data.message);
        return;
      }

      setStatus("Connected and listening for RabbitMQ messages.");
      setMessages((current) => [data, ...current].slice(0, MAX_MESSAGES));
    };

    source.onerror = () => {
      setStatus("Unable to connect to RabbitMQ. Check the server and refresh.");
    };

    return () => {
      source.close();
    };
  }, []);

  const hasMessages = messages.length > 0;
  const lastUpdated = useMemo(() => messages[0]?.receivedAt, [messages]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <span className={styles.badge}>Next.js + RabbitMQ</span>
          <h1>Realtime RabbitMQ messages in one page</h1>
          <p>
            This page opens a live stream to the Next.js server, which consumes
            messages from RabbitMQ and pushes them to the browser immediately.
          </p>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Connection status</h2>
              <p>{status}</p>
            </div>
            <div className={styles.meta}>
              <span>Queue: {process.env.NEXT_PUBLIC_RABBITMQ_QUEUE ?? "messages"}</span>
              <span>
                Last update: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Waiting for data"}
              </span>
            </div>
          </div>

          <div className={styles.messages}>
            {hasMessages ? (
              <ul className={styles.messageList}>
                {messages.map((message) => (
                  <li key={message.id} className={styles.messageItem}>
                    <div className={styles.messageHeader}>
                      <strong>Message received</strong>
                      <time dateTime={message.receivedAt}>
                        {new Date(message.receivedAt).toLocaleTimeString()}
                      </time>
                    </div>
                    <pre>{message.content}</pre>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <p>No messages yet.</p>
                <span>Publish a message to RabbitMQ and it will appear here in realtime.</span>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
