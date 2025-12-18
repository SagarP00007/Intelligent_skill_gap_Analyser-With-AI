from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
import json
import os
import re
import io
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import pypdf
import docx
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-123'  # Change this in production
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

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

@app.route('/api/extract_skills', methods=['POST'])
def extract_skills():
    text = ""
    
    # Check for file upload
    if 'file' in request.files:
        file = request.files['file']
        if file.filename != '':
            filename = file.filename.lower()
            try:
                if filename.endswith('.pdf'):
                    pdf_reader = pypdf.PdfReader(file)
                    for page in pdf_reader.pages:
                        text += page.extract_text() + "\n"
                elif filename.endswith('.docx'):
                    doc = docx.Document(file)
                    for para in doc.paragraphs:
                        text += para.text + "\n"
                elif filename.endswith('.txt'):
                    text = file.read().decode('utf-8')
            except Exception as e:
                print(f"Error parsing file: {e}")
                return jsonify({"error": "Failed to parse file"}), 400
    
    # Check for raw text if no file or empty text from file
    if not text:
        data = request.json or {}  # Handle case where request.json is None if using FormData
        text = data.get('text', '')
        # If using FormData, text might be in request.form
        if not text:
            text = request.form.get('text', '')
    
    if not text:
        return jsonify({"skills": []})
        
    skills_data = load_skills()
    found_skills = set()
    
    # Create a set of all unique skills across all roles
    all_possible_skills = set()
    for role in skills_data['roles'].values():
        for skill in role['skills']:
            all_possible_skills.add(skill)
            
    # Simple regex matching (checking if skill name exists in text, case insensitive)
    # This acts as our "AI" parser
    for skill in all_possible_skills:
        # Escape special characters for regex, ensure word boundary if possible
        # We use simple string check for simplicity if regex is too complex for arbitrary strings
        if re.search(r'\b' + re.escape(skill) + r'\b', text, re.IGNORECASE):
            found_skills.add(skill)
            
    return jsonify({"skills": list(found_skills)})

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        user_exists = User.query.filter_by(email=email).first()
        if user_exists:
            flash('Email already registered', 'error')
            return redirect(url_for('register'))
            
        new_user = User(username=username, email=email, password=generate_password_hash(password, method='scrypt'))
        db.session.add(new_user)
        db.session.commit()
        
        login_user(new_user)
        return redirect(url_for('home'))
        
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('home'))
        else:
            flash('Login failed. Check email and password', 'error')
            
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
