# Cloud Resource Optimizer Web Application

A production-grade web application that predicts cloud resource failures using AI-powered analysis. Built with Flask, AWS SageMaker, and modern web technologies.

## 🚀 Features

- **AI-Powered Predictions**: Machine learning model deployed via AWS SageMaker
- **Interactive UI**: Modern dark-themed interface with 3D animations
- **Real-time Analysis**: Instant resource failure predictions
- **Power BI Integration**: Embedded dashboards for analytics
- **Responsive Design**: Works on desktop and mobile devices
- **GitHub Codespaces Ready**: Complete development environment setup

## 🛠 Technical Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript (Three.js, GSAP)
- **Machine Learning**: AWS SageMaker
- **Database**: None (stateless predictions)
- **Deployment**: GitHub Codespaces
- **Cloud Services**: AWS (SageMaker, S3, IAM, CloudWatch)

## 📦 Quick Start

### GitHub Codespaces (Recommended)

1. Click "Code" → "Codespaces" → "Create codespace on main"
2. Wait for automatic setup
3. Access the application on port 5000

### Local Development

```bash
git clone https://github.com/Piyush-hacker/Daily_Tasks.git
cd Daily_Tasks
pip install -r requirements.txt
python app.py
```

Visit `http://localhost:5000` to use the application.

## 📊 Input Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `requested_cpu_percent` | Float | Requested CPU percentage (0-100) |
| `requested_memory_percent` | Float | Requested memory percentage (0-100) |
| `maximum_cpu_percent` | Float | Peak CPU usage (0-100) |
| `maximum_memory_percent` | Float | Peak memory usage (0-100) |
| `priority_level` | Integer | Resource priority (1-5, 1=highest) |
| `assigned_memory` | Float | Assigned memory in GB |
| `page_cache_memory` | Float | Page cache memory in GB |
| `vertical_scaling` | Boolean | Vertical scaling enabled (0/1) |
| `total_run_time` | Float | Total runtime in hours |

## 🎯 Usage

1. **Landing Page**: View dashboard and introduction
2. **Prediction Form**: Enter cloud resource metrics
3. **Results Page**: Get AI predictions and recommendations

## 📝 Documentation

For detailed documentation, see the `docs/` directory:
- [AWS Deployment Guide](docs/aws-deployment.md)
- [Troubleshooting](docs/troubleshooting.md)

<!---LeetCode Topics Start-->
# Legacy LeetCode Content
## Two Pointers
|  |
| ------- |
| [0868-push-dominoes](https://github.com/Piyush-hacker/Daily_Tasks/tree/master/0868-push-dominoes) |
## String
|  |
| ------- |
| [0868-push-dominoes](https://github.com/Piyush-hacker/Daily_Tasks/tree/master/0868-push-dominoes) |
## Dynamic Programming
|  |
| ------- |
| [0868-push-dominoes](https://github.com/Piyush-hacker/Daily_Tasks/tree/master/0868-push-dominoes) |
<!---LeetCode Topics End-->