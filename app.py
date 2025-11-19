from flask import Flask, render_template, request, jsonify
import json

app = Flask(__name__)

# Load your skill dataset (can be a small JSON file)
skills_data = {
    "Data Scientist": ["Python", "Machine Learning", "Statistics", "SQL"],
    "Web Developer": ["HTML", "CSS", "JavaScript", "React", "Flask"],
    "AI Engineer": ["Python", "TensorFlow", "Deep Learning", "NLP"]
}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    current_skills = [s.strip().lower() for s in data['skills'].split(',')]
    career = data['career']

    required = skills_data.get(career, [])
    missing = [skill for skill in required if skill.lower() not in current_skills]

    return jsonify({
        "career": career,
        "missing_skills": missing,
        "recommendations": [f"Learn {m}" for m in missing]
    })

if __name__ == '__main__':
    app.run(debug=True)
