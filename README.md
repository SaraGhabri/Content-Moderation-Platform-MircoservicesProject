# 🚀 Content Moderation Platform - Microservices avec GitOps

> Plateforme de modération de contenu basée sur une architecture microservices, déployée sur Kubernetes avec ArgoCD (GitOps) et monitorée par Prometheus + Grafana.

---

## 📋 Table des matières

1. [Architecture du projet](#-architecture-du-projet)
2. [Technologies utilisées](#-technologies-utilisées)
3. [Prérequis](#-prérequis)
4. [Partie 1 : CI/CD avec Jenkins & Docker](#-partie-1--cicd-avec-jenkins--docker)
5. [Partie 2 : Helm Charts (Microservices)](#-partie-2--helm-charts-microservices)
6. [Partie 3 : Helm Umbrella Chart](#-partie-3--helm-umbrella-chart)
7. [Partie 4 : Déploiement Kafka](#-partie-4--déploiement-kafka)
8. [Partie 5 : GitOps avec ArgoCD](#-partie-5--gitops-avec-argocd)
9. [Partie 6 : Monitoring (Prometheus + Grafana)](#-partie-6--monitoring-prometheus--grafana)
10. [Obstacles rencontrés et solutions](#-obstacles-rencontrés-et-solutions)
11. [Démonstration en live](#-démonstration-en-live)

---

## 🏗️ Architecture du projet

```
┌─────────────────────────────────────────────────────────────────┐
│                          GitHub Repository                       │
│                     (GitOps Source of Truth)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                           ArgoCD                                 │
│                  (Continuous Deployment)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster (Minikube)                 │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Namespace: content-moderation                   │  │
│  │                                                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ API Gateway  │  │Content Service│ │Classification│  │  │
│  │  │  (Node.js)   │  │  (Node.js)    │ │   Service    │  │  │
│  │  │   Port 3000  │  │   Port 3001   │ │  (Python)    │  │  │
│  │  └──────┬───────┘  └───────┬───────┘ └──────┬───────┘  │  │
│  │         │                  │                 │          │  │
│  │         └──────────────────┼─────────────────┘          │  │
│  │                            │                            │  │
│  │                    ┌───────▼────────┐                   │  │
│  │                    │     Kafka      │                   │  │
│  │                    │  (StatefulSet) │                   │  │
│  │                    └───────┬────────┘                   │  │
│  │                            │                            │  │
│  │                    ┌───────▼────────┐                   │  │
│  │                    │  Moderation    │                   │  │
│  │                    │    Worker      │                   │  │
│  │                    │   (Node.js)    │                   │  │
│  │                    └────────────────┘                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Namespace: monitoring                         │  │
│  │                                                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │  Prometheus  │  │   Grafana    │  │ Alertmanager │  │  │
│  │  │              │◄─┤              │  │              │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technologies utilisées

| Catégorie | Technologies |
|-----------|-------------|
| **Containerisation** | Docker, Docker Hub |
| **Orchestration** | Kubernetes (Minikube) |
| **Package Manager** | Helm 3 |
| **GitOps** | ArgoCD |
| **CI/CD** | Jenkins (Docker-in-Docker) |
| **Messaging** | Apache Kafka (KRaft mode) |
| **Monitoring** | Prometheus, Grafana |
| **Languages** | Node.js, Python, gRPC |

---

## 📦 Prérequis

### Logiciels requis

```bash
# Docker
docker --version
# Docker version 24.0+

# Minikube
minikube version
# minikube version: v1.37.0+

# Kubectl
kubectl version --client
# Client Version: v1.34.0+

# Helm
helm version
# version.BuildInfo{Version:"v3.16.0+"}

# Git
git --version
# git version 2.39.0+
```

### Configuration système minimale

- **CPU** : 4 cores (8 recommandé)
- **RAM** : 8 GB (16 GB recommandé)
- **Disque** : 50 GB libres
- **OS** : Linux (Ubuntu 24.04 testé)

---

## 🔧 Partie 1 : CI/CD avec Jenkins & Docker

### 1.1 Démarrage de Jenkins (Docker-in-Docker)

Nous utilisons une image Jenkins personnalisée avec Docker intégré pour construire et pousser les images.

```bash
# Lancer Jenkins avec Docker-in-Docker
sudo docker run -d \
  --name jenkins \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -p 8081:8080 \
  -p 50000:50000 \
  salahgo/jenkins:dind
```

### 1.2 Configuration Jenkins

1. **Accéder à Jenkins** : http://localhost:8081

2. **Récupérer le mot de passe initial** :
```bash
sudo docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

3. **Installer les plugins nécessaires** :
   - Docker Pipeline
   - Git
   - Credentials Binding

4. **Configurer les credentials Docker Hub** :
   - Aller dans : Manage Jenkins → Credentials → Global
   - Ajouter : Username/Password (Docker Hub)
   - ID : `dockerhub-credentials`

### 1.3 Création des Pipelines Jenkins

Pour chaque microservice, créer un **Pipeline Job** avec ce Jenkinsfile :

Jenkins utilisé pour le build, scan via Trivy et le push sur DockerHub SEULEMENT.

### 1.4 Vérification des images sur Docker Hub

```bash
# Vérifier les images poussées
docker search UserCredentials (sarahghabri)
```

Images attendues :
- `sarahghabri/api-gateway:10`
- `sarahghabri/content-service:10`
- `sarahghabri/classification-service:9`
- `sarahghabri/moderation-worker:11`

---

## 📦 Partie 2 : Helm Charts (Microservices)

### 2.1 Démarrage de Minikube

```bash
# Démarrer Minikube
minikube start --driver=docker --cpus=4 --memory=8192

# Vérifier le cluster
kubectl get nodes
```

### 2.2 Création des Helm Charts individuels

Pour chaque microservice, créer un Helm chart :

```bash
cd helm/

# Créer les charts
helm create api-gateway
helm create content-service
helm create classification-service
helm create moderation-worker
```

### 2.3 Configuration des Helm Charts

#### Structure type d'un chart (exemple : api-gateway)

```
helm/api-gateway/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── deployment.yaml
    └── service.yaml
```

#### `Chart.yaml`

```yaml
apiVersion: v2
name: api-gateway
description: API Gateway for Content Moderation Platform
type: application
version: 0.1.0
appVersion: "1.16.0"
```

#### `values.yaml`

```yaml
replicaCount: 1

image:
  repository: sarahghabri/api-gateway
  pullPolicy: Always
  tag: "10"

service:
  type: ClusterIP
  port: 3000

env:
  PORT: "3000"
  KAFKA_BROKER: "kafka:9092"
  KAFKA_CLIENT_ID: "api-gateway"
  CLASSIFICATION_SERVICE_URL: "classification-service:50051"
  NODE_ENV: "production"

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

initContainers:
  - name: wait-for-kafka
    image: busybox:1.36
    command:
      - sh
      - -c
      - |
        echo "Waiting for Kafka..."
        until nc -z kafka 9092; do
          echo "Kafka not ready, waiting..."
          sleep 5
        done
        echo "Kafka is ready!"
```

#### `templates/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "api-gateway.fullname" . }}
  labels:
    {{- include "api-gateway.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "api-gateway.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "api-gateway.selectorLabels" . | nindent 8 }}
    spec:
      initContainers:
        - name: wait-for-kafka
          image: busybox:1.36
          command:
            - sh
            - -c
            - |
              echo "Waiting for Kafka..."
              until nc -z kafka 9092; do
                echo "Kafka not ready, waiting..."
                sleep 5
              done
              echo "Kafka is ready!"
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.service.port }}
              protocol: TCP
          env:
            - name: PORT
              value: {{ .Values.env.PORT | quote }}
            - name: KAFKA_BROKER
              value: {{ .Values.env.KAFKA_BROKER | quote }}
            - name: KAFKA_CLIENT_ID
              value: {{ .Values.env.KAFKA_CLIENT_ID | quote }}
            - name: CLASSIFICATION_SERVICE_URL
              value: {{ .Values.env.CLASSIFICATION_SERVICE_URL | quote }}
            - name: NODE_ENV
              value: {{ .Values.env.NODE_ENV | quote }}
          livenessProbe:
            httpGet:
              path: /
              port: {{ .Values.service.port }}
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /
              port: {{ .Values.service.port }}
            initialDelaySeconds: 20
            periodSeconds: 5
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
```

#### `templates/service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "api-gateway.fullname" . }}
  labels:
    {{- include "api-gateway.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
      protocol: TCP
      name: http
  selector:
    {{- include "api-gateway.selectorLabels" . | nindent 4 }}
```

**Répéter cette structure pour** :
- `content-service` (port 3001)
- `classification-service` (port 50051, gRPC)
- `moderation-worker` (pas de service, seulement Deployment)

### 2.4 Test des Helm Charts individuels

```bash
# Test de rendu des manifests
helm template api-gateway ./helm/api-gateway

# Installation de test (sans déploiement réel)
helm install --dry-run --debug api-gateway ./helm/api-gateway
```

---

## 🎯 Partie 3 : Helm Umbrella Chart

### 3.1 Création de l'Umbrella Chart

```bash
cd helm/
helm create content-moderation
```

### 3.2 Configuration de l'Umbrella Chart

#### Structure

```
helm/content-moderation/
├── Chart.yaml
├── values.yaml
├── charts/           # Contiendra les sous-charts packagés
└── templates/        # Vide (pas de templates propres)
```

#### `Chart.yaml`

```yaml
apiVersion: v2
name: content-moderation
description: Global Helm chart for Content Moderation Platform
type: application
version: 0.1.0

dependencies:
  - name: api-gateway
    version: 0.1.0
    repository: "file://../api-gateway"

  - name: content-service
    version: 0.1.0
    repository: "file://../content-service"

  - name: classification-service
    version: 0.1.0
    repository: "file://../classification-service"

  - name: moderation-worker
    version: 0.1.0
    repository: "file://../moderation-worker"
```

#### `values.yaml`

```yaml
# Valeurs globales pour tous les sous-charts
api-gateway:
  replicaCount: 1

content-service:
  replicaCount: 1

classification-service:
  replicaCount: 1

moderation-worker:
  replicaCount: 1
```

### 3.3 Build des dépendances Helm

```bash
cd helm/content-moderation

# Télécharger et packager les dépendances
helm dependency update

# Vérifier que les .tgz sont créés
ls charts/
# api-gateway-0.1.0.tgz
# content-service-0.1.0.tgz
# classification-service-0.1.0.tgz
# moderation-worker-0.1.0.tgz
```

### 3.4 Test de l'Umbrella Chart

```bash
# Rendu des manifests complets
helm template content-moderation ./helm/content-moderation

# Installation locale (test)
helm install content-moderation ./helm/content-moderation -n content-moderation --create-namespace
```

---

## ☕ Partie 4 : Déploiement Kafka

### 4.1 Pourquoi des manifests Kubernetes au lieu de Helm ?

**Problème rencontré** : Les charts Helm Bitnami pour Kafka présentaient des **incompatibilités de versions** avec Minikube et nécessitaient des configurations complexes.

**Solution** : Création de manifests Kubernetes personnalisés avec Kafka en mode **KRaft** (sans Zookeeper).

### 4.3 Déploiement de Kafka

```bash
# Appliquer le manifest Kafka
kubectl apply -f k8s/kafka.yaml

# Vérifier le déploiement
kubectl get pods -n content-moderation | grep kafka
kubectl get statefulset -n content-moderation
```

---

## 🔄 Partie 5 : GitOps avec ArgoCD

### 5.1 Installation d'ArgoCD

```bash
# Créer le namespace ArgoCD
kubectl create namespace argocd

# Installer ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Attendre que tous les pods soient prêts
kubectl get pods -n argocd -w
```

### 5.2 Nettoyage du repo Git (problème de taille)

**Problème** : Le repo Git contenait 118 Mo d'historique, causant des **timeouts** lors du cloning par ArgoCD.

**Solution** : Créer un repo propre sans historique :


### 5.3 Configuration des timeouts ArgoCD

```bash
# Augmenter les timeouts Helm
kubectl patch configmap argocd-cm -n argocd --type merge -p '{
  "data": {
    "timeout.reconciliation": "600s",
    "timeout.hard.reconciliation": "600s",
    "repository.credentials": "600s",
    "server.repo.server.timeout.seconds": "600"
  }
}'

# Redémarrer ArgoCD
kubectl rollout restart deployment argocd-repo-server -n argocd
kubectl rollout restart deployment argocd-server -n argocd
kubectl rollout restart statefulset argocd-application-controller -n argocd
```

### 5.4 Création de l'Application ArgoCD

#### Fichier `content-moderation-app.yaml`

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: content-moderation-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/SaraGhabri/Content-Moderation-Platform-MircoservicesProject.git
    targetRevision: main
    path: helm/content-moderation
    helm:
      skipCrds: false
  destination:
    server: https://kubernetes.default.svc
    namespace: content-moderation
  syncPolicy:
    automated:
      prune: false
      selfHeal: false
    syncOptions:
      - CreateNamespace=true
```

#### Déploiement

```bash
# Appliquer l'application
kubectl apply -f content-moderation-app.yaml

# Vérifier l'état
kubectl get application -n argocd
```

### 5.5 Accès à l'interface ArgoCD

```bash
# Port-forward vers ArgoCD
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Récupérer le mot de passe admin
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

# Ouvrir le navigateur
# URL : https://localhost:8080
# Username : admin
# Password : (résultat de la commande ci-dessus)
```

### 5.6 Synchronisation de l'application

Dans l'interface ArgoCD :
1. Cliquer sur l'application **content-moderation-app**
2. Cliquer sur **SYNC**
3. Cliquer sur **SYNCHRONIZE**

Résultat  :
- **SYNC STATUS** : Synced ✅
- **HEALTH STATUS** : Healthy ✅

---

## 📊 Partie 6 : Monitoring (Prometheus + Grafana)

### 6.1 Installation du stack Prometheus

```bash
# Ajouter le repo Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Créer le namespace monitoring
kubectl create namespace monitoring
```

### 6.2 Configuration du monitoring

#### Fichier `values-monitoring.yaml`

```yaml
prometheus:
  prometheusSpec:
    retention: 7d
    resources:
      requests:
        cpu: 200m
        memory: 512Mi
      limits:
        cpu: 500m
        memory: 1Gi
    storageSpec:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 5Gi

grafana:
  enabled: true
  adminPassword: admin
  persistence:
    enabled: true
    size: 2Gi
  service:
    type: NodePort
    nodePort: 30000

alertmanager:
  enabled: true

nodeExporter:
  enabled: true

kubeStateMetrics:
  enabled: true
```

### 6.3 Installation

```bash
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f values-monitoring.yaml

# Vérifier les pods
kubectl get pods -n monitoring
```

### 6.4 Accès à Grafana

```bash
# Port-forward vers Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Récupérer le mot de passe (si différent de "admin")
kubectl get secret --namespace monitoring prometheus-grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode ; echo

# Ouvrir le navigateur
# URL : http://localhost:3000
# Username : admin
# Password : ChangePasswordForSecurityPurposes
```

### 6.5 Import des dashboards Grafana

Dans Grafana :

1. **Dashboard Kubernetes Cluster Monitoring**
   - Dashboards → New → Import
   - ID : **15757**
   - Load → Prometheus → Import

2. **Dashboard Kubernetes Pod Monitoring**
   - Dashboards → New → Import
   - ID : **15760**
   - Load → Prometheus → Import

3. **Dashboard Node Exporter Full**
   - Dashboards → New → Import
   - ID : **1860**
   - Load → Prometheus → Import

### 6.6 Accès à Prometheus (optionnel)

```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# URL : http://localhost:9090
```

---

## 🚧 Obstacles rencontrés et solutions

### 1. Timeout ArgoCD lors du cloning Git

**Problème** :
```
rpc error: code = DeadlineExceeded desc = context deadline exceeded
```

**Cause** : Le repo Git contenait 118 Mo d'historique (.git), causant des timeouts lors du cloning par ArgoCD sur Minikube.

**Solution** :
```bash
# Créer un repo Git propre sans historique
cd ~/projetdevops
cp -r Content-Moderation-Platform-MircoservicesProject Content-Moderation-Clean
cd Content-Moderation-Clean
rm -rf .git
git init
git add .
git commit -m "Initial commit - clean repo for ArgoCD"
git branch -M main
git remote add origin https://github.com/SaraGhabri/Content-Moderation-Platform-MircoservicesProject.git
git push origin main --force
```

**Résultat** : Taille du .git réduite à 752K ✅

---

### 2. Incompatibilité Helm Bitnami Kafka

**Problème** : Les charts Helm Bitnami pour Kafka nécessitaient des versions d'images incompatibles avec Minikube et des configurations complexes (Zookeeper, etc.).

**Solution** : Création de manifests Kubernetes personnalisés avec Kafka en mode KRaft (sans Zookeeper).

Fichier : `k8s/kafka.yaml`

**Avantages** :
- Kafka déployé en mode standalone (KRaft)
- Configuration simplifiée
- Compatible Minikube

---

### 3. Pods moderation-worker bloqués en Init

**Problème** :
```
Init:1/2  (wait-for-classification-service)
nc: bad address 'classification-service'
```

**Cause** : Le nom du service généré par Helm était `content-moderation-app-classification-service`, mais l'initContainer cherchait `classification-service`.

**Solution** : Modifier le template Helm du moderation-worker :

```yaml
# helm/moderation-worker/templates/deployment.yaml
initContainers:
  - name: wait-for-classification-service
    image: busybox:1.36
    command:
      - sh
      - -c
      - |
        echo "Waiting for Classification Service..."
        until nc -z {{ .Release.Name }}-classification-service 50051; do
          echo "Classification Service not ready, waiting..."
          sleep 5
        done
        echo "Classification Service is ready!"
```

---

### 4. Espace disque insuffisant sur Minikube

**Problème** :
```
Docker is nearly out of disk space (91% of capacity)
```

**Solutions appliquées** :

```bash
# 1. Nettoyage Docker
docker system prune -a -f --volumes

# 2. Nettoyage du repo Git
cd ~/projetdevops/Content-Moderation-Platform-MircoservicesProject
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

**Résultat** : Espace disque libéré de 91% à 76% ✅

---

### 5. ArgoCD repo-server en CrashLoopBackOff

**Problème** : Après un patch des ressources du repo-server, le pod crashait :

```
argocd-repo-server-xxx  0/1  CrashLoopBackOff
```

**Cause** : Le patch kubectl avait supprimé l'attribut `image` obligatoire du container.

**Solution** :

```bash
# Rollback au dernier état stable
kubectl rollout undo deployment argocd-repo-server -n argocd

# Utiliser kubectl set resources au lieu de patch
kubectl set resources deployment argocd-repo-server -n argocd \
  --requests=cpu=500m,memory=512Mi \
  --limits=cpu=1000m,memory=1Gi
```

---

### 6. Namespace par défaut au lieu de content-moderation

**Problème** : Kafka était déployé dans le namespace `default` au lieu de `content-moderation`, donc les microservices ne pouvaient pas le contacter.

**Solution** :

```bash
# Remplacer tous les namespaces dans kafka.yaml
sed -i 's/namespace: default/namespace: content-moderation/g' k8s/kafka.yaml
sed -i 's/kafka.default.svc.cluster.local/kafka.content-moderation.svc.cluster.local/g' k8s/kafka.yaml

# Vérifier les changements
cat k8s/kafka.yaml | grep -E "namespace:|kafka.*svc.cluster.local"

# Réappliquer
kubectl apply -f k8s/kafka.yaml
```

---

### 7. Helm dependency update échoue

**Problème** :
```
Error: Chart.yaml file is missing
```

**Cause** : La commande était exécutée dans `helm/` au lieu de `helm/content-moderation/`.

**Solution** :

```bash
# Aller dans le bon dossier
cd helm/content-moderation

# Puis lancer
helm dependency update
```

---


Feel Free to reachout for feedback.
