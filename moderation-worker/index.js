const { Kafka } = require('kafkajs');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const kafka = new Kafka({
  clientId: 'moderation-worker',
  brokers: ['kafka:9092'],
});

const consumer = kafka.consumer({ groupId: 'moderation-group' });

const PROTO_PATH = './classification.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const proto = grpc.loadPackageDefinition(packageDefinition).classification;

const client = new proto.Classifier('classification-service:50051', grpc.credentials.createInsecure());

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
