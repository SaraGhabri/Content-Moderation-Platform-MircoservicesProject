const express = require('express');
const { Kafka } = require('kafkajs');
const { ApolloServer, gql } = require('apollo-server-express');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Kafka setup
const kafka = new Kafka({
  clientId: 'api-gateway',
  brokers: ['kafka:9092'],
});
const producer = kafka.producer();

// GraphQL schema
const typeDefs = gql`
  type Mutation {
    moderate(content: String!): ModerationResponse!
  }

  type ModerationResponse {
    status: String!
  }

  type Query {
    _empty: String
  }
`;

// GraphQL resolvers
const resolvers = {
  Mutation: {
    moderate: async (_, { content }) => {
      if (!content) {
        throw new Error('Content is required');
      }

      console.log('Received moderation request (GraphQL):', content);

      try {
        await producer.send({
          topic: 'moderation-topic',
          messages: [{ value: content }],
        });
        return { status: 'submitted' };
      } catch (error) {
        console.error('Kafka error:', error);
        throw new Error('Failed to submit content for moderation');
      }
    },
  },
};

// Apollo Server setup
async function startServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });
}

// REST fallback endpoint
app.get('/', (req, res) => {
  res.send('API Gateway is running');
});

// REST moderation endpoint (still supported)
app.post('/moderate', async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  console.log('Received moderation request (REST):', content);

  try {
    await producer.send({
      topic: 'moderation-topic',
      messages: [{ value: content }],
    });

    res.json({ status: 'submitted' });
  } catch (error) {
    console.error('Kafka error:', error);
    res.status(500).json({ error: 'Failed to submit content for moderation' });
  }
});

// Start server and Kafka producer
(async () => {
  await producer.connect();
  await startServer();
  app.listen(PORT, () => {
    console.log(`API Gateway listening on port ${PORT}`);
    console.log(`GraphQL endpoint available at http://localhost:${PORT}/graphql`);
  });
})();
