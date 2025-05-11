// index.js
const express = require('express');
const { Kafka } = require('kafkajs');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const kafka = new Kafka({
  clientId: 'content-service',
  brokers: ['kafka:9092'],
});

const producer = kafka.producer();

app.post('/submit', async (req, res) => {
  const content = req.body.content;
  if (!content) return res.status(400).json({ error: 'No content provided' });

  await producer.connect();
  await producer.send({
    topic: 'moderation-topic',
    messages: [{ value: content }],
  });

  res.json({ status: 'submitted', content });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Content Service listening on port ${PORT}`);
});
