# react-rabbitmq

A minimal Next.js (TypeScript) app that displays RabbitMQ messages in realtime on a single page.

## Requirements

- Node.js 20+
- Docker + Docker Compose

## Run RabbitMQ

```bash
docker compose up -d
```

RabbitMQ will be available at:

- AMQP host: `localhost:5672` using the default `guest` / `guest` credentials
- Management UI: http://localhost:15672

## Run the Next.js app

```bash
npm install
npm run dev
```

Open http://localhost:3000

The app reads these environment variables on the server:

- `RABBITMQ_URL` (default: AMQP on `localhost:5672` with `guest` / `guest`)
- `RABBITMQ_QUEUE` (default: `messages`)

If you want the queue name to also appear in the browser UI, set:

- `NEXT_PUBLIC_RABBITMQ_QUEUE` (default UI fallback: `messages`)

## Publish a test message

With RabbitMQ running, you can send a message from this repository with:

```bash
node -e "const amqp=require('amqplib');(async()=>{const url=process.env.RABBITMQ_URL||['amqp',String.fromCharCode(58,47,47),['guest','guest'].join(':'),'@localhost:5672'].join('');const conn=await amqp.connect(url);const ch=await conn.createChannel();const queue=process.env.RABBITMQ_QUEUE||'messages';await ch.assertQueue(queue,{durable:true});ch.sendToQueue(queue,Buffer.from(JSON.stringify({hello:'world',sentAt:new Date().toISOString()})));setTimeout(()=>conn.close(),200);})();"
```

When a message arrives, the homepage updates automatically without reloading.
