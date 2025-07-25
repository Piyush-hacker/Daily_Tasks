# AWS Deployment Guide

This guide covers deploying the Cloud Resource Optimizer to AWS with SageMaker integration.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Python 3.12+
- Trained ML model (pickle file)

## 1. AWS IAM Setup

### Create IAM Role for SageMaker

```bash
# Create trust policy
cat > sagemaker-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "sagemaker.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
  --role-name CloudResourceOptimizerRole \
  --assume-role-policy-document file://sagemaker-trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name CloudResourceOptimizerRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonSageMakerFullAccess

aws iam attach-role-policy \
  --role-name CloudResourceOptimizerRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

### Create IAM User for Application

```bash
# Create user
aws iam create-user --user-name cloud-optimizer-app

# Create policy for app access
cat > app-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sagemaker:InvokeEndpoint"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam put-user-policy \
  --user-name cloud-optimizer-app \
  --policy-name SageMakerInvokePolicy \
  --policy-document file://app-policy.json

# Create access keys
aws iam create-access-key --user-name cloud-optimizer-app
```

## 2. Model Deployment to SageMaker

### Prepare Model Artifacts

```python
# inference.py - Create this file for SageMaker inference
import joblib
import json
import numpy as np

def model_fn(model_dir):
    """Load the model for inference"""
    model = joblib.load(f"{model_dir}/model.pkl")
    return model

def input_fn(request_body, content_type):
    """Parse input data for predictions"""
    if content_type == 'application/json':
        input_data = json.loads(request_body)
        return np.array(input_data['instances'])
    else:
        raise ValueError(f"Unsupported content type: {content_type}")

def predict_fn(input_data, model):
    """Make predictions using the model"""
    predictions = model.predict_proba(input_data)[:, 1]  # Get probability of positive class
    return predictions.tolist()

def output_fn(predictions, content_type):
    """Format the predictions for output"""
    if content_type == 'application/json':
        return json.dumps({'predictions': predictions})
    else:
        raise ValueError(f"Unsupported content type: {content_type}")
```

### Create Model Package

```bash
# Create model directory
mkdir -p model-package

# Copy your trained model and inference script
cp your-trained-model.pkl model-package/model.pkl
cp inference.py model-package/

# Create requirements.txt for the model
cat > model-package/requirements.txt << EOF
joblib
numpy
scikit-learn
EOF

# Create tar.gz package
cd model-package
tar czf ../model.tar.gz *
cd ..

# Upload to S3
aws s3 cp model.tar.gz s3://your-model-bucket/cloud-resource-optimizer/model.tar.gz
```

### Deploy Model to SageMaker

```python
# deploy_model.py
import boto3
import sagemaker
from sagemaker.sklearn.model import SKLearnModel

# Configuration
role_arn = "arn:aws:iam::YOUR-ACCOUNT:role/CloudResourceOptimizerRole"
model_s3_path = "s3://your-model-bucket/cloud-resource-optimizer/model.tar.gz"
endpoint_name = "cloud-resource-optimizer-endpoint"

# Create SageMaker session
sagemaker_session = sagemaker.Session()

# Create model
sklearn_model = SKLearnModel(
    model_data=model_s3_path,
    role=role_arn,
    entry_point='inference.py',
    framework_version='1.0-1',
    py_version='py3',
    sagemaker_session=sagemaker_session
)

# Deploy to endpoint
predictor = sklearn_model.deploy(
    initial_instance_count=1,
    instance_type='ml.t2.medium',
    endpoint_name=endpoint_name
)

print(f"Model deployed to endpoint: {endpoint_name}")
```

## 3. Application Configuration

### Environment Variables

Set these environment variables in your deployment environment:

```bash
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export SAGEMAKER_ENDPOINT_NAME=cloud-resource-optimizer-endpoint
export FLASK_ENV=production
export SECRET_KEY=your-production-secret-key
```

### Update Application Configuration

```python
# config.py - Update for production
import os

class ProductionConfig:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
    SAGEMAKER_ENDPOINT_NAME = os.environ.get('SAGEMAKER_ENDPOINT_NAME')
    DEBUG = False
    TESTING = False
```

## 4. CloudWatch Monitoring

### Enable Logging

```python
# Add to app.py
import logging
from pythonjsonlogger import jsonlogger

# Configure logging
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger = logging.getLogger()
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)
```

### Create CloudWatch Dashboard

```bash
# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name "CloudResourceOptimizer" \
  --dashboard-body file://dashboard.json
```

Dashboard configuration (`dashboard.json`):
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/SageMaker", "InvocationsPerInstance", "EndpointName", "cloud-resource-optimizer-endpoint"],
          [".", "ModelLatency", ".", "."],
          [".", "InvocationModelErrors", ".", "."]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "SageMaker Endpoint Metrics"
      }
    }
  ]
}
```

## 5. Application Deployment Options

### Option A: AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize application
eb init cloud-resource-optimizer

# Create environment
eb create production

# Deploy
eb deploy
```

### Option B: AWS EC2 with Application Load Balancer

1. **Launch EC2 Instance**:
   - AMI: Amazon Linux 2
   - Instance Type: t3.medium
   - Security Group: Allow HTTP/HTTPS

2. **Setup Application**:
```bash
# SSH into instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install dependencies
sudo yum update -y
sudo yum install -y python3 python3-pip git nginx

# Clone and setup application
git clone https://github.com/Piyush-hacker/Daily_Tasks.git
cd Daily_Tasks
pip3 install -r requirements.txt

# Configure systemd service
sudo tee /etc/systemd/system/cloud-optimizer.service > /dev/null <<EOF
[Unit]
Description=Cloud Resource Optimizer
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user/Daily_Tasks
Environment=PATH=/home/ec2-user/.local/bin
ExecStart=/usr/bin/python3 app.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl enable cloud-optimizer
sudo systemctl start cloud-optimizer
```

3. **Configure Nginx**:
```nginx
# /etc/nginx/conf.d/cloud-optimizer.conf
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static {
        alias /home/ec2-user/Daily_Tasks/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Option C: AWS ECS with Fargate

1. **Create Dockerfile**:
```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

2. **Build and Push to ECR**:
```bash
# Create ECR repository
aws ecr create-repository --repository-name cloud-resource-optimizer

# Build and push
docker build -t cloud-resource-optimizer .
docker tag cloud-resource-optimizer:latest YOUR-ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/cloud-resource-optimizer:latest
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR-ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker push YOUR-ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/cloud-resource-optimizer:latest
```

3. **Create ECS Service**:
```bash
# Create task definition and service using AWS Console or CLI
aws ecs create-cluster --cluster-name cloud-optimizer-cluster
```

## 6. Security Best Practices

### SSL/TLS Configuration

```bash
# For EC2/Nginx setup
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Security Headers

Add to Nginx configuration:
```nginx
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## 7. Scaling and Performance

### Auto Scaling

```bash
# Create launch template
aws ec2 create-launch-template \
  --launch-template-name cloud-optimizer-template \
  --launch-template-data file://launch-template.json

# Create auto scaling group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name cloud-optimizer-asg \
  --launch-template LaunchTemplateName=cloud-optimizer-template,Version=1 \
  --min-size 1 \
  --max-size 5 \
  --desired-capacity 2
```

### SageMaker Endpoint Scaling

```bash
# Configure auto scaling for SageMaker endpoint
aws application-autoscaling register-scalable-target \
  --service-namespace sagemaker \
  --resource-id endpoint/cloud-resource-optimizer-endpoint/variant/AllTraffic \
  --scalable-dimension sagemaker:variant:DesiredInstanceCount \
  --min-capacity 1 \
  --max-capacity 5
```

## 8. Troubleshooting

### Common Issues

1. **SageMaker Endpoint Errors**:
```bash
# Check endpoint status
aws sagemaker describe-endpoint --endpoint-name cloud-resource-optimizer-endpoint

# Check logs
aws logs describe-log-groups --log-group-name-prefix /aws/sagemaker/Endpoints
```

2. **Application Logs**:
```bash
# For EC2 deployment
sudo journalctl -u cloud-optimizer -f

# For ECS deployment
aws logs get-log-events --log-group-name /ecs/cloud-optimizer
```

3. **Performance Issues**:
- Monitor CloudWatch metrics
- Check SageMaker endpoint latency
- Review application response times
- Consider caching frequently used predictions

## 9. Cost Optimization

### SageMaker Cost Management

- Use `ml.t2.medium` instances for development
- Scale down during low-traffic periods
- Consider SageMaker Serverless Inference for variable workloads
- Monitor and set up billing alerts

### Infrastructure Cost Management

- Use Reserved Instances for predictable workloads
- Implement auto-scaling to match demand
- Use CloudFront for static asset delivery
- Regular cost reviews and optimization

## 10. Maintenance

### Model Updates

```python
# Script for model updates
def update_model(new_model_path, endpoint_name):
    # Upload new model to S3
    # Create new SageMaker model
    # Update endpoint configuration
    # Deploy with blue-green deployment
    pass
```

### Monitoring and Alerts

Set up CloudWatch alarms for:
- SageMaker endpoint errors
- Application response times
- EC2 instance health
- Cost thresholds

This completes the AWS deployment setup for the Cloud Resource Optimizer application.