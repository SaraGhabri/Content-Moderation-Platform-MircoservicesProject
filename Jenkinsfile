pipeline {
    agent any

    triggers { 
        pollSCM('H/5 * * * *') 
    }

    environment {
        IMAGE_API_GATEWAY = 'sarahghabri/api-gateway'
        IMAGE_CLASSIFICATION_SERVICE = 'sarahghabri/classification-service'
        IMAGE_CONTENT_SERVICE = 'sarahghabri/content-service'
        IMAGE_MODERATION_WORKER = 'sarahghabri/moderation-worker'
    }

    stages {

        stage('Checkout') {
            steps {
                git(
                    branch: 'main',
                    url: 'git@github.com:SaraGhabri/Content-Moderation-Platform-MircoservicesProject.git',
                    credentialsId: 'gitlab_ssh'
                )
            }
        }

        stage('Build + Push ALL services') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub',
                        usernameVariable: 'DH_USER',
                        passwordVariable: 'DH_PASS'
                    )
                ]) {
                    sh '''
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin

                        for SERVICE in api-gateway classification-service content-service moderation-worker
                        do
                          IMAGE_VAR="IMAGE_$(echo $SERVICE | tr a-z- A-Z_)"
                          IMAGE=$(eval echo \\$$IMAGE_VAR)

                          echo "🚀 Building $SERVICE"
                          docker build -t $IMAGE:${BUILD_NUMBER} $SERVICE
                          docker tag  $IMAGE:${BUILD_NUMBER} $IMAGE:latest
                          docker push $IMAGE:${BUILD_NUMBER}
                          docker push $IMAGE:latest
                        done
                    '''
                }
            }
        }

        stage('Trivy Security Scan (ALL IMAGES)') {
            steps {
                sh '''
                    mkdir -p trivy-reports

                    for IMAGE in \
                        $IMAGE_API_GATEWAY \
                        $IMAGE_CLASSIFICATION_SERVICE \
                        $IMAGE_CONTENT_SERVICE \
                        $IMAGE_MODERATION_WORKER
                    do
                        echo "🔍 Scanning $IMAGE:latest"
                        docker run --rm \
                          -v /var/run/docker.sock:/var/run/docker.sock \
                          aquasec/trivy image \
                          $IMAGE:latest \
                          --format table \
                          --output trivy-reports/$(basename $IMAGE)-trivy.txt || true
                    done
                '''
            }
        }
    }

    post {
        always {
            echo "🧹 Cleaning Docker system"
            sh 'docker system prune -af || true'
        }
        failure {
            echo "❌ Pipeline failed"
        }
        success {
            echo "✅ Pipeline succeeded"
        }
    }
}
