const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = './classification.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const proto = grpc.loadPackageDefinition(packageDefinition).classification;

// Expanded list of offensive words (you can add more as needed)
const offensiveWords = [
  'fuck',
  'shit',
  'bitch',
  'nigga',
  'asshole',
  'bastard',
  'cunt',
  'dick',
  'faggot',
  'slut',
  'whore',
  'damn',
  'crap',
  'nigger', // more offensive variant
];

// Function to detect offensive words with word boundary and case insensitivity
function containsOffensiveWord(text) {
  const pattern = new RegExp(`\\b(${offensiveWords.join('|')})\\b`, 'i');  
  return pattern.test(text);
}

function classifyContent(call, callback) {
  const content = call.request.content;
  console.log('Classifying:', content);

  const isOffensive = containsOffensiveWord(content);
  const label = isOffensive ? 'offensive' : 'safe';
  const confidence = isOffensive ? 0.95 : 0.99;

  callback(null, { label, confidence });
}

function main() {
  const server = new grpc.Server();
  server.addService(proto.Classifier.service, { Classify: classifyContent });
  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
    console.log('gRPC Classification Service running on port 50051');
    server.start();
  });
}

main();