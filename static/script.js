let currentSkills = [];
let quizQuestions = [];
let currentQuizIndex = 0;
let quizScore = 0;
let currentRoleKey = "";

// Add Skill Button Handler
document.getElementById("addSkillBtn").addEventListener("click", () => {
    const skillNameInput = document.getElementById("skillName");
    const proficiencySelect = document.getElementById("proficiencyLevel");

    const name = skillNameInput.value.trim();
    const level = proficiencySelect.value;

    if (!name) {
        alert("Please enter a skill name.");
        return;
    }

    if (!level) {
        alert("Please select a proficiency level.");
        return;
    }

    // Check for duplicates
    if (currentSkills.some(skill => skill.name.toLowerCase() === name.toLowerCase())) {
        alert("This skill is already added.");
        return;
    }

    currentSkills.push({ name, level });
    renderSkills();

    // Reset inputs
    skillNameInput.value = "";
    proficiencySelect.value = "";
    skillNameInput.focus();
});

function renderSkills() {
    const listContainer = document.getElementById("skillsList");
    listContainer.innerHTML = "";

    currentSkills.forEach((skill, index) => {
        const tag = document.createElement("div");
        tag.className = "skill-entry";
        tag.innerHTML = `
            <div class="skill-info">
                <span class="skill-name">${skill.name}</span>
                <span class="skill-level">${skill.level}</span>
            </div>
            <button class="remove-skill-btn" onclick="removeSkill(${index})">
                <i class="ph-bold ph-x"></i>
            </button>
        `;
        listContainer.appendChild(tag);
    });
}

// Global function to remove skill (accessible from onclick)
window.removeSkill = (index) => {
    currentSkills.splice(index, 1);
    renderSkills();
};

document.getElementById("analyzeBtn").addEventListener("click", async () => {
    const careerSelect = document.getElementById("career");
    const career = careerSelect.value;
    currentRoleKey = career; // Store for quiz

    const resultDiv = document.getElementById("result");
    const loadingDiv = document.getElementById("loading");
    const btn = document.getElementById("analyzeBtn");

    // Convert structured skills to comma-separated string for backend compatibility
    const skillsString = currentSkills.map(s => s.name).join(", ");

    // Validation
    if (!career) {
        alert("Please select a target role.");
        return;
    }

    if (currentSkills.length === 0) {
        alert("Please add at least one skill.");
        return;
    }

    // UI: Loading State
    resultDiv.classList.add("hidden");
    loadingDiv.classList.remove("hidden");
    btn.disabled = true;
    btn.style.opacity = "0.7";
    btn.innerHTML = `<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Analyzing...`;

    try {
        const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ career, skills: skillsString })
        });

        const data = await response.json();

        // UI: Reset button
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.innerHTML = `<span>Analyze Gap</span><i class="ph-bold ph-arrow-right"></i>`;
        loadingDiv.classList.add("hidden");
        resultDiv.classList.remove("hidden");

        // 1. Render Missing Skills
        const missingContainer = document.getElementById("missingSkillsContainer");
        if (data.missing_skills.length === 0) {
            missingContainer.innerHTML = `
                <div class="success-message">
                    <i class="ph-fill ph-check-circle" style="font-size: 1.5rem;"></i>
                    <p>You have all the core skills!</p>
                </div>`;
            document.getElementById("quizCTA").classList.add("hidden");
        } else {
            missingContainer.innerHTML = data.missing_skills
                .map(skill => `<span class="skill-tag">${skill}</span>`)
                .join("");

            // Show Quiz CTA
            document.getElementById("quizCTA").classList.remove("hidden");
        }

        // 2. Render Recommendations
        const recList = document.getElementById("recommendationsList");
        recList.innerHTML = data.recommendations
            .map(rec => `<li class="rec-item"><i class="ph-bold ph-book-open"></i> <span>${rec}</span></li>`)
            .join("");

        // 3. Render Market Data
        renderMarketData(data.market_data);

        // 4. Render Roadmap
        renderRoadmap(data.roadmap, data.missing_skills);

        // 5. Save Analysis (Auto-save)
        saveAnalysis(data.career, data.missing_skills.length, data.missing_skills.length + currentSkills.length);

    } catch (error) {
        console.error("Error:", error);
        loadingDiv.classList.add("hidden");
        btn.disabled = false;
        btn.innerHTML = `<span>Analyze Gap</span><i class="ph-bold ph-arrow-right"></i>`;
        alert("Something went wrong. Please try again.");
    }
});

function renderMarketData(marketData) {
    const container = document.getElementById("marketData");
    if (!marketData || Object.keys(marketData).length === 0) {
        container.classList.add("hidden");
        return;
    }
    container.classList.remove("hidden");
    container.innerHTML = `
        <div class="market-stat">
            <h4>Avg Salary</h4>
            <p>${marketData.avg_salary || "N/A"}</p>
        </div>
        <div class="market-stat" style="border-left:1px solid var(--glass-border); border-right:1px solid var(--glass-border); padding:0 20px;">
            <h4>Open Roles</h4>
            <p>${marketData.open_roles || "N/A"}</p>
        </div>
        <div class="market-stat">
            <h4>Growth</h4>
            <p style="color: var(--primary-color);">${marketData.growth_rate || "N/A"}</p>
        </div>
    `;
}

function renderRoadmap(roadmap, missingSkills) {
    const container = document.getElementById("roadmapContainer");
    if (!roadmap || roadmap.length === 0) {
        container.innerHTML = "<p style='color:var(--text-muted);'>No roadmap available.</p>";
        return;
    }

    // Simple heuristic: if step topic is in missingSkills, it's not done.
    // Since topics are broad ("JavaScript Mastery"), matching is fuzzy.
    // For this version, we'll mark all as "Upcoming" except the first one if user is a beginner.
    // Or we can just list them. Let's list them highlighting step number.

    container.innerHTML = roadmap.map((step, index) => {
        return `
            <div class="roadmap-step">
                <h5>Step ${step.step}: ${step.topic}</h5>
                <p>${step.description}</p>
            </div>
        `;
    }).join("");
}

async function saveAnalysis(role, missingCount, totalSkills) {
    try {
        await fetch("/api/save_analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role, missing_count: missingCount, total_skills: totalSkills })
        });
    } catch (e) {
        console.log("Failed to save analysis history");
    }
}

// --- QUIZ LOGIC ---

const quizModal = document.getElementById("quizModal");
const startQuizBtn = document.getElementById("startQuizBtn");
const closeBtn = document.querySelector(".close-modal");

startQuizBtn.addEventListener("click", async () => {
    // Fetch quiz questions
    try {
        startQuizBtn.innerHTML = "<i class='ph-bold ph-spinner ph-spin'></i> Loading...";
        const res = await fetch(`/api/quiz/${currentRoleKey}`);
        const data = await res.json();

        if (data.length === 0) {
            alert("No quiz available for this role yet.");
            startQuizBtn.innerText = "Start Quiz";
            return;
        }

        quizQuestions = data;
        currentQuizIndex = 0;
        quizScore = 0;
        showQuizModal();
        renderQuizQuestion();
        startQuizBtn.innerText = "Start Quiz";
    } catch (e) {
        console.error(e);
        alert("Failed to load quiz.");
        startQuizBtn.innerText = "Start Quiz";
    }
});

closeBtn.addEventListener("click", () => {
    quizModal.classList.add("hidden");
});

window.onclick = (event) => {
    if (event.target == quizModal) {
        quizModal.classList.add("hidden");
    }
};

function showQuizModal() {
    quizModal.classList.remove("hidden");
    document.getElementById("quizResult").classList.add("hidden");
    document.getElementById("quizQuestions").classList.remove("hidden");
}

function renderQuizQuestion() {
    const container = document.getElementById("quizQuestions");
    const q = quizQuestions[currentQuizIndex];

    container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <span style="font-size:0.8rem; color:var(--primary-color);">Question ${currentQuizIndex + 1}/${quizQuestions.length}</span>
            <h4 style="margin: 10px 0; font-size: 1.1rem;">${q.question}</h4>
        </div>
        <div class="options-list">
            ${q.options.map((opt, idx) => `
                <button class="quiz-option" onclick="handleAnswer(${idx})">${opt}</button>
            `).join("")}
        </div>
    `;
}

window.handleAnswer = (selectedIndex) => {
    const q = quizQuestions[currentQuizIndex];
    if (selectedIndex === q.correct) {
        quizScore++;
    }

    currentQuizIndex++;
    if (currentQuizIndex < quizQuestions.length) {
        renderQuizQuestion();
    } else {
        showQuizResults();
    }
};

function showQuizResults() {
    const qContainer = document.getElementById("quizQuestions");
    const rContainer = document.getElementById("quizResult");

    qContainer.classList.add("hidden");
    rContainer.classList.remove("hidden");

    const percentage = Math.round((quizScore / quizQuestions.length) * 100);
    let msg = "Keep learning!";
    let color = "var(--warning-color)";
    let icon = "ph-smiley-sad";

    if (percentage === 100) {
        msg = "Perfect Score! You're a master.";
        color = "var(--success-color)";
        icon = "ph-trophy";
    } else if (percentage >= 60) {
        msg = "Good job! You're getting there.";
        color = "var(--primary-color)";
        icon = "ph-thumbs-up";
    }

    rContainer.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <i class="ph-fill ${icon}" style="font-size: 4rem; color: ${color}; margin-bottom: 10px;"></i>
            <h3 style="margin-bottom: 5px;">Quiz Complete!</h3>
            <div class="quiz-result-score" style="color: ${color};">${quizScore} / ${quizQuestions.length}</div>
            <p>${msg}</p>
            <button class="small-btn" onclick="document.getElementById('quizModal').classList.add('hidden')" style="margin-top: 20px; width: 100%;">Close</button>
        </div>
    `;
}

// --- 3D TILT EFFECT ---
document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".dashboard-card, .glass-card");

    cards.forEach(card => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calculate center
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Calculate rotation (max 10 degrees)
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            card.style.transition = "transform 0.1s";
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
            card.style.transition = "transform 0.5s ease";
        });
    });
});
