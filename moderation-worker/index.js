const { Kafka } = require('kafkajs');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// --------------------
// Kafka configuration
// --------------------
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'moderation-worker',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
});

const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || 'moderation-group',
});

// --------------------
// gRPC configuration
// --------------------
const PROTO_PATH = path.join(__dirname, 'classification.proto');

// 1️⃣ Load proto FIRST
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// 2️⃣ Initialize proto object
const proto = grpc.loadPackageDefinition(packageDefinition).classification;

// 3️⃣ Create client AFTER proto exists
const classificationServiceUrl =
  process.env.CLASSIFICATION_SERVICE_URL || 'classification-service:50051';

const client = new proto.Classifier(
  classificationServiceUrl,
  grpc.credentials.createInsecure()
);

// --------------------
// Worker logic
// --------------------
async function start() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'moderation-topic', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const content = message.value.toString();
      console.log('Received content:', content);

      client.Classify({ content }, (err, response) => {
        if (err) {
          console.error('gRPC error:', err);
        } else {
          console.log('Classification result:', response);
        }
      });
    },
  });
}

start().catch(console.error);
