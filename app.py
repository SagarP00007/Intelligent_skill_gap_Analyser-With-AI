from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

# Load skills dataset from external JSON file
def load_skills():
    try:
        with open('skills.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"roles": {}}

@app.route('/')
def home():
    skills_data = load_skills()
    # Pass role keys and titles to the template for the dropdown
    roles_list = [
        {"key": key, "title": value["title"]} 
        for key, value in skills_data["roles"].items()
    ]
    # Sort alphabetically by title
    roles_list.sort(key=lambda x: x["title"])
    return render_template('index.html', roles=roles_list)

@app.route('/api/analyze', methods=['POST'])
def analyze():
    skills_data = load_skills()
    data = request.json
    # Clean input
    current_skills = {s.strip().lower() for s in data['skills'].split(',') if s.strip()}
    
    # The frontend now sends the unique key (e.g., "data_scientist")
    role_key = data['career']
    
    if not role_key or role_key not in skills_data['roles']:
        return jsonify({"error": "Role not found"}), 400

    role_info = skills_data['roles'][role_key]
    required_skills = role_info['skills']
    career_display_name = role_info['title']
    
    # Identify missing skills
    missing = [skill for skill in required_skills if skill.lower() not in current_skills]
    
    # Generate recommendations
    recommendations = []
    for m in missing:
        recommendations.append(f"Master {m}")
        
    if missing and 'resources' in role_info:
        for res in role_info['resources']:
            recommendations.append(f"Check out: <a href='{res['url']}' target='_blank' style='color: var(--primary-color); text-decoration: underline;'>{res['title']}</a>")

    return jsonify({
        "career": career_display_name,
        "missing_skills": missing,
        "recommendations": recommendations
    })

if __name__ == '__main__':
    app.run(debug=True)
