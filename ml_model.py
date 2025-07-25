import boto3
import json
import numpy as np
import pickle
from flask import current_app
import os

class CloudResourcePredictor:
    """Cloud resource failure predictor using AWS SageMaker."""
    
    def __init__(self):
        self.sagemaker_runtime = None
        self.endpoint_name = None
        self._initialize_sagemaker()
    
    def _initialize_sagemaker(self):
        """Initialize SageMaker runtime client."""
        try:
            # Initialize SageMaker runtime client
            self.sagemaker_runtime = boto3.client(
                'sagemaker-runtime',
                region_name=os.environ.get('AWS_REGION', 'us-east-1')
            )
            self.endpoint_name = os.environ.get('SAGEMAKER_ENDPOINT_NAME', 'cloud-resource-optimizer-endpoint')
            print(f"SageMaker client initialized for endpoint: {self.endpoint_name}")
        except Exception as e:
            print(f"Warning: Could not initialize SageMaker client: {e}")
            print("Using mock predictions for development")
    
    def _prepare_features(self, features_dict):
        """Prepare features for model input."""
        # Expected feature order for the model
        feature_order = [
            'requested_cpu_percent',
            'requested_memory_percent', 
            'maximum_cpu_percent',
            'maximum_memory_percent',
            'priority_level',
            'assigned_memory',
            'page_cache_memory',
            'vertical_scaling',
            'total_run_time'
        ]
        
        # Create feature array in correct order
        features_array = []
        for feature in feature_order:
            features_array.append(features_dict.get(feature, 0))
        
        return np.array(features_array).reshape(1, -1)
    
    def predict(self, features):
        """
        Make prediction using SageMaker endpoint or mock prediction.
        
        Args:
            features (dict): Dictionary containing feature values
            
        Returns:
            dict: Prediction result with prediction and confidence
        """
        try:
            # Prepare features
            input_data = self._prepare_features(features)
            
            # Try SageMaker prediction first
            if self.sagemaker_runtime and self.endpoint_name:
                return self._predict_sagemaker(input_data)
            else:
                return self._predict_mock(input_data, features)
                
        except Exception as e:
            print(f"Prediction error: {e}")
            # Fallback to mock prediction
            return self._predict_mock(input_data, features)
    
    def _predict_sagemaker(self, input_data):
        """Make prediction using SageMaker endpoint."""
        try:
            # Prepare payload for SageMaker
            payload = {
                'instances': input_data.tolist()
            }
            
            # Invoke SageMaker endpoint
            response = self.sagemaker_runtime.invoke_endpoint(
                EndpointName=self.endpoint_name,
                ContentType='application/json',
                Body=json.dumps(payload)
            )
            
            # Parse response
            result = json.loads(response['Body'].read().decode())
            prediction = result['predictions'][0]
            
            # Convert to binary prediction
            binary_prediction = "Failed" if prediction > 0.5 else "Not Failed"
            confidence = float(prediction) if prediction > 0.5 else 1.0 - float(prediction)
            
            return {
                'prediction': binary_prediction,
                'confidence': round(confidence * 100, 2),
                'raw_score': float(prediction)
            }
            
        except Exception as e:
            print(f"SageMaker prediction error: {e}")
            raise e
    
    def _predict_mock(self, input_data, features):
        """Mock prediction for development/testing."""
        # Simple mock logic based on feature values
        cpu_stress = (features.get('requested_cpu_percent', 0) + 
                     features.get('maximum_cpu_percent', 0)) / 2
        memory_stress = (features.get('requested_memory_percent', 0) + 
                        features.get('maximum_memory_percent', 0)) / 2
        
        # Calculate risk score
        risk_score = (cpu_stress * 0.4 + memory_stress * 0.4 + 
                     features.get('total_run_time', 0) * 0.0001 + 
                     (10 - features.get('priority_level', 5)) * 0.2)
        
        # Normalize risk score
        risk_score = min(risk_score / 100, 1.0)
        
        # Determine prediction
        binary_prediction = "Failed" if risk_score > 0.6 else "Not Failed"
        confidence = risk_score if risk_score > 0.6 else 1.0 - risk_score
        
        return {
            'prediction': binary_prediction,
            'confidence': round(confidence * 100, 2),
            'raw_score': round(risk_score, 4),
            'note': 'Mock prediction for development'
        }

class ModelDeployment:
    """Utilities for deploying model to SageMaker."""
    
    @staticmethod
    def create_model_tar(model_path, output_path):
        """Create tar.gz file for SageMaker deployment."""
        import tarfile
        
        with tarfile.open(output_path, 'w:gz') as tar:
            tar.add(model_path, arcname='model.pkl')
            # Add inference script if needed
            # tar.add('inference.py', arcname='inference.py')
    
    @staticmethod
    def deploy_to_sagemaker(model_s3_path, role_arn, endpoint_name):
        """Deploy model to SageMaker endpoint."""
        import sagemaker
        from sagemaker.sklearn.model import SKLearnModel
        
        # Create SageMaker model
        sklearn_model = SKLearnModel(
            model_data=model_s3_path,
            role=role_arn,
            entry_point='inference.py',
            framework_version='1.0-1',
            py_version='py3'
        )
        
        # Deploy to endpoint
        predictor = sklearn_model.deploy(
            initial_instance_count=1,
            instance_type='ml.t2.medium',
            endpoint_name=endpoint_name
        )
        
        return predictor