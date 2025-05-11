# 🧠 Content Moderation Platform

![Microservices Architecture](https://img.shields.io/badge/architecture-microservices-blue) 
![Docker](https://img.shields.io/badge/deployment-docker-2496ED) 
![Kafka](https://img.shields.io/badge/messaging-kafka-231F20) 
![gRPC](https://img.shields.io/badge/communication-grpc-4285F4)

A scalable microservices-based content moderation platform that automatically detects and classifies inappropriate content using REST, GraphQL, Kafka, gRPC, and Docker.

## Table of Contents
- [🚀 Purpose](#-purpose)
- [🧩 Microservices Overview](#-microservices-overview)
- [🛠️ Technologies Used](#️-technologies-used)
- [🐳 Docker & Setup](#-docker--setup)
- [🏗️ Architecture Overview](#️-architecture-overview)
- [🎯 Innovation Highlights](#-innovation-highlights)
- [🌱 Future Enhancements](#-future-enhancements)
- [📦 Dependencies & Installation](#-dependencies--installation)
- [🧪 Testing Guide](#-testing-guide)
- [📁 .gitignore](#-gitignore)
- [📌 Final Notes](#-final-notes)

## 🚀 Purpose

This project aims to automatically detect inappropriate or offensive content (e.g., hate speech, profanity) in user-generated text. Designed using a microservices architecture, it handles high-throughput moderation workflows and provides both REST and GraphQL APIs. Kafka handles async message brokering, while gRPC is used for internal service communication for speed and type safety.

## 🧩 Microservices Overview

| Service               | Role                                                                 |
|-----------------------|----------------------------------------------------------------------|
| 🔐 **API Gateway**     | Exposes REST/GraphQL endpoints, publishes to Kafka                   |
| ⚙️ **Moderation Worker** | Kafka consumer, communicates with Classification Service via gRPC    |
| 🧪 **Classification Service** | gRPC server, classifies content (mock logic: safe/unsafe)           |
| 📊 **Dashboard Service** (optional) | Displays statistics or moderation history                          |
| 📚 **Content Service** (optional) | Stores and retrieves original/moderated content                    |
| 📡 **Kafka + Zookeeper** | Async messaging and broker management                              |

## 🛠️ Technologies Used

| Technology        | Role                                                                 |
|-------------------|----------------------------------------------------------------------|
| REST             | Used in API Gateway via `/moderate` POST endpoint                    |
| GraphQL          | Exposed via Apollo Server for flexible mutation handling             |
| gRPC             | Used between Moderation Worker and Classification Service            |
| Kafka            | Enables async, decoupled communication between services              |
| Docker           | Containerizes each microservice for consistency                      |
| Docker Compose   | Orchestrates multi-container setup locally                           |

## 🐳 Docker & Setup

**Why Docker?**
- Each service runs in its own container
- Simplifies environment setup and teardown
- Provides consistency across development and deployment

### 🔧 Common Commands

```bash
# Start all services with rebuild:
sudo docker-compose up --build

# Stop and clean up:
sudo docker-compose down -v

# View logs:
sudo docker logs -f content-moderation-platform-moderation-worker-1

# Exec into Kafka container:
sudo docker exec -it content-moderation-platform-kafka bash

# List Kafka topics:
kafka-topics.sh --bootstrap-server kafka:9092 --list

```
## 🏗️ Architecture Overview
📥 User
↓ (REST/GraphQL)
🛡️ API Gateway
↓ (Kafka publish)
📨 Kafka (moderation-topic)
↓ (Kafka consume)
🧰 Moderation Worker
↓ (gRPC)
🧠 Classification Service

(Optional):
    📊 Dashboard Service
    📚 Content Service
Each arrow represents an interaction: HTTP, GraphQL, Kafka, or gRPC.

🎯 Innovation Highlights

    Combined REST, GraphQL, Kafka, and gRPC in one system

    Asynchronous communication using Kafka for decoupling

    GraphQL endpoint enhances API flexibility

    Scalable: each service can be independently scaled

    Easily extensible with real ML models, analytics, storage

🌱 Future Enhancements

    Integrate MongoDB/PostgreSQL for persistence

    JWT-based authentication & RBAC

    ML/NLP moderation models (e.g., using TensorFlow or Transformers)

    Real-time dashboard with charts/stats

    Dead-letter queues for Kafka failures

    WebSocket/Firebase-based user notifications

📦 Dependencies & Installation
API Gateway:
``` bash

npm install express kafkajs apollo-server-express graphql

```


Moderation Worker:
``` bash

npm install kafkajs grpc @grpc/proto-loader
```
Classification Service:
```bash

npm install grpc @grpc/proto-loader
```
Kafka/Zookeeper (Docker Images):

    bitnami/kafka:3.4.0

    bitnami/zookeeper:latest

🧪 Testing Guide
📨 REST:
``` bash

curl -X POST http://localhost:3000/moderate \
-H "Content-Type: application/json" \
-d '{"content":"This is clean"}'
```
🔮 GraphQL (Apollo Sandbox or Postman):

GraphQL endpoint: http://localhost:3000/graphql
graphql

mutation {
  moderate(content: "This is offensive") {
    status
  }
}

📁 .gitignore
```bash
node_modules/
.env
dist/
*.log
.DS_Store
coverage/
*.local
*.test.js
*.out
docker-data/
```
📌 Final Notes

This project demonstrates how to build a modular and modern content moderation platform using multiple communication paradigms. It is an ideal base for teams looking to integrate NLP moderation at scale in real-world applications.

Feel free to contribute or fork this repo to extend it!

© 2025 Content Moderation Platform



