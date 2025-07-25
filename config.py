import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'cloud-resource-optimizer-secret-key-2024'
    
    # AWS Configuration
    AWS_REGION = os.environ.get('AWS_REGION') or 'us-east-1'
    SAGEMAKER_ENDPOINT_NAME = os.environ.get('SAGEMAKER_ENDPOINT_NAME') or 'cloud-resource-optimizer-endpoint'
    
    # Power BI Configuration
    POWER_BI_EMBED_URL = os.environ.get('POWER_BI_EMBED_URL') or ''
    
    # Application Configuration
    DEBUG = os.environ.get('FLASK_DEBUG') or False
    TESTING = False

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}