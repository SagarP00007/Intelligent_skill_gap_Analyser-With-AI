let currentSkills = [];

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
    const career = document.getElementById("career").value;
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

        if (data.missing_skills.length === 0) {
            resultDiv.innerHTML = `
                <div class="success-message">
                    <i class="ph-fill ph-check-circle" style="font-size: 1.5rem;"></i>
                    <div>
                        <strong>You're ready!</strong>
                        <p style="font-size:0.9rem; margin-top:2px;">You already have all the core skills required for a ${data.career}.</p>
                    </div>
                </div>`;
        } else {
            const missingSkillsHtml = data.missing_skills
                .map(skill => `<span class="skill-tag">${skill}</span>`)
                .join("");

            const recommendationsHtml = data.recommendations
                .map(rec => `<li class="rec-item"><i class="ph-bold ph-book-open"></i> <span>${rec}</span></li>`)
                .join("");

            resultDiv.innerHTML = `
                <div class="result-header">
                    <i class="ph-bold ph-warning-circle"></i> Missing Skills Found:
                </div>
                <div class="tags-container">
                    ${missingSkillsHtml}
                </div>
                
                <div class="result-header" style="margin-top:20px;">
                    <i class="ph-bold ph-strategy"></i> Recommended Learning Path:
                </div>
                <ul class="recommendations-list">
                    ${recommendationsHtml}
                </ul>
            `;
        }

    } catch (error) {
        console.error("Error:", error);
        loadingDiv.classList.add("hidden");
        btn.disabled = false;
        btn.innerHTML = `<span>Analyze Gap</span><i class="ph-bold ph-arrow-right"></i>`;
        alert("Something went wrong. Please try again.");
    }
});
