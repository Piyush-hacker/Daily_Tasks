from flask import Flask, render_template, request, jsonify
import os
import json
import numpy as np

def create_app(config_name=None):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Basic configuration without external config
    app.config['SECRET_KEY'] = 'cloud-resource-optimizer-secret-key-2024'
    app.config['DEBUG'] = True
    
    # Initialize ML predictor with mock implementation
    predictor = MockCloudResourcePredictor()
    
    @app.route('/')
    def index():
        """Landing page with animated question and Power BI dashboard."""
        return render_template('index.html')
    
    @app.route('/predict')
    def predict_page():
        """Prediction form page."""
        return render_template('prediction.html')
    
    @app.route('/api/predict', methods=['POST'])
    def predict():
        """API endpoint for resource failure prediction."""
        try:
            # Get input data from request
            data = request.get_json()
            
            # Extract required fields
            features = {
                'requested_cpu_percent': float(data.get('requested_cpu_percent', 0)),
                'requested_memory_percent': float(data.get('requested_memory_percent', 0)),
                'maximum_cpu_percent': float(data.get('maximum_cpu_percent', 0)),
                'maximum_memory_percent': float(data.get('maximum_memory_percent', 0)),
                'priority_level': int(data.get('priority_level', 1)),
                'assigned_memory': float(data.get('assigned_memory', 0)),
                'page_cache_memory': float(data.get('page_cache_memory', 0)),
                'vertical_scaling': int(data.get('vertical_scaling', 0)),
                'total_run_time': float(data.get('total_run_time', 0))
            }
            
            # Make prediction
            prediction_result = predictor.predict(features)
            
            return jsonify({
                'success': True,
                'prediction': prediction_result['prediction'],
                'confidence': prediction_result['confidence'],
                'features': features
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
    
    @app.route('/results')
    def results():
        """Results page with visualization."""
        return render_template('results.html')
    
    @app.errorhandler(404)
    def not_found(error):
        return render_template('404.html'), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return render_template('500.html'), 500
    
    return app

class MockCloudResourcePredictor:
    """Mock cloud resource failure predictor for development."""
    
    def predict(self, features):
        """
        Mock prediction for development/testing.
        
        Args:
            features (dict): Dictionary containing feature values
            
        Returns:
            dict: Prediction result with prediction and confidence
        """
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

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)