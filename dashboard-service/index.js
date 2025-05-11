const { ApolloServer, gql } = require('apollo-server');

// Dummy data (you can connect this to Mongo or Kafka later)
const moderationResults = [
  { id: '1', content: 'This is clean', label: 'safe', confidence: 0.99 },
  { id: '2', content: 'This is badword', label: 'offensive', confidence: 0.95 },
];

// GraphQL schema
const typeDefs = gql`
  type Result {
    id: ID!
    content: String!
    label: String!
    confidence: Float!
  }

  type Query {
    allResults: [Result]
    resultById(id: ID!): Result
  }
`;

// Resolvers
const resolvers = {
  Query: {
    allResults: () => moderationResults,
    resultById: (_, { id }) => moderationResults.find(r => r.id === id),
  },
};

// Create Apollo Server
const server = new ApolloServer({ typeDefs, resolvers });

// Start
server.listen({ port: 4000 }).then(({ url }) => {
  console.log(`🚀 Dashboard GraphQL API ready at ${url}`);
});
