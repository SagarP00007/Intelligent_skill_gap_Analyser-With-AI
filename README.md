💡 LevelUp – Intelligent Skill Gap Analyzer Using AI

LevelUp is an AI-driven web application that identifies the skill gaps between a learner's current abilities and the requirements of their desired career role. 
Using simple NLP-based matching and a skills dataset, 
the system generates a personalized learning roadmap with recommended courses and resources to help learners upskill effectively.

🚀 Features

🔍 Skill Gap Analysis
Compares user-entered skills with industry-required skills.
Detects missing or weak skills for the chosen career role.

🤖 AI-Driven Recommendations
Suggests personalized learning paths.
Recommends relevant courses from a dynamic dataset.

💻 Web-Based Interface
Simple and clean UI made with HTML, CSS, JavaScript.
Real-time communication with Flask backend using REST API.

📦 Dataset
Uses a JSON file to store job roles, required skills, and recommended courses.

⚙️ Lightweight AI/NLP Logic
Token matching
Basic similarity scoring
Rule-based recommendations

🛠️ Tech Stack
Frontend
HTML5
CSS3
JavaScript

Backend
Python
Flask (REST API)

Data
JSON Dataset (skills_data.json)

📁 Project Structure
LevelUp/
│
├── app.py                 # Flask backend
├── skills_data.json       # Dataset for job roles & skills
│
├── static/
│   ├── style.css          # Stylesheet
│   └── script.js          # Frontend logic
│
└── templates/
    └── index.html         # Main UI


▶️ How to Run the Project
1. Install Requirements

Make sure Python 3 is installed.
pip install flask

Start the Flask Server by running this command in terminal inside your project folder -
"python app.py"

Open in Browser
Visit:
http://127.0.0.1:5000

🧠 How It Works

User selects a job role
User enters their skills
Frontend sends a request to:
/api/analyze
Backend compares:
Required skills (from JSON)
User skills (input)
System returns:
Missing skills
Recommended courses
UI displays the results instantly.
