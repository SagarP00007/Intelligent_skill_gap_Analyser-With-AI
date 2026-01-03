let currentSkills = [];
let currentRoleKey = "";

// Add Skill Button Handler
document.getElementById("addSkillBtn").addEventListener("click", () => {
    const skillNameInput = document.getElementById("skillName");
    const proficiencySelect = document.getElementById("proficiencyLevel");

    const name = skillNameInput.value.trim();
    const level = proficiencySelect.value;
    const btn = document.getElementById("addSkillBtn");

    if (!name) {
        shakeInput(skillNameInput);
        return;
    }

    if (!level) {
        shakeInput(proficiencySelect);
        return;
    }

    // Check for duplicates
    if (currentSkills.some(skill => skill.name.toLowerCase() === name.toLowerCase())) {
        shakeInput(skillNameInput);
        return;
    }

    currentSkills.push({ name, level });
    renderSkills();

    // Reset inputs
    skillNameInput.value = "";
    proficiencySelect.value = "";
    skillNameInput.focus();

    // Feedback visual
    btn.innerHTML = `<i class="ph-bold ph-check"></i>`;
    setTimeout(() => btn.innerHTML = `<i class="ph-bold ph-plus"></i>`, 1000);
});

function shakeInput(element) {
    element.style.borderColor = "var(--error-color)";
    element.style.transform = "translateX(5px)";
    setTimeout(() => {
        element.style.transform = "translateX(-5px)";
        setTimeout(() => {
            element.style.transform = "translateX(0)";
            element.style.borderColor = "var(--glass-border)";
        }, 100);
    }, 100);
}

function renderSkills() {
    const listContainer = document.getElementById("skillsList");
    listContainer.innerHTML = "";

    currentSkills.forEach((skill, index) => {
        const tag = document.createElement("div");
        tag.className = "skill-entry";
        tag.innerHTML = `
            <div class="skill-info">
                <span class="skill-name" style="font-weight:600;">${skill.name}</span>
                <span class="skill-level" style="font-size:0.8em; opacity:0.7;">${skill.level}</span>
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

    const resultsCard = document.getElementById("resultsCard");
    const scanOverlay = document.getElementById("scannerOverlay");

    // Convert structured skills to comma-separated string for backend compatibility
    const skillsString = currentSkills.map(s => s.name).join(", ");

    // Validation
    if (!career) {
        alert("TARGET DESIGNATION REQUIRED.");
        return;
    }

    if (currentSkills.length === 0) {
        alert("NO SKILLS DETECTED. PLEASE INPUT DATA.");
        return;
    }

    // UI: Scanning State
    scanOverlay.classList.remove("hidden");

    // Simulate initial delay purely for effect (Neural Handshake)
    await new Promise(r => setTimeout(r, 1000));

    try {
        const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ career, skills: skillsString })
        });

        const data = await response.json();

        // Simulate processing time after getting data
        await new Promise(r => setTimeout(r, 1500));

        // UI: Hide Scanner, Show Results
        scanOverlay.classList.add("hidden");
        resultsCard.style.display = "block";
        resultsCard.scrollIntoView({ behavior: "smooth" });
        resultsCard.classList.add("pop-in"); // Custom animation class if we add it, or default CSS handles entry

        // 1. Render Missing Skills
        const missingContainer = document.getElementById("missingSkillsContainer");
        if (data.missing_skills.length === 0) {
            missingContainer.innerHTML = `
                <div class="success-message" style="width:100%;">
                    <i class="ph-fill ph-check-circle" style="font-size: 1.5rem;"></i>
                    <p>OPTIMAL SKILLSET CONFIRMED. READY FOR DEPLOYMENT.</p>
                </div>`;
        } else {
            missingContainer.innerHTML = data.missing_skills
                .map(skill => `<span class="skill-tag" style="border:1px solid var(--warning-color); color:var(--warning-color); background:rgba(245, 158, 11, 0.1);">${skill}</span>`)
                .join("");
        }

        // 2. Render Recommendations
        const recList = document.getElementById("recommendationsList");
        recList.innerHTML = data.recommendations
            .map((rec, i) => `<li class="rec-item" style="animation-delay:${i * 0.1}s"><i class="ph-bold ph-read-cv-logo"></i> <span>${rec}</span></li>`)
            .join("");

        // 2.5 Render Alternatives (Strategic Pivots)
        const altContainer = document.getElementById("alternativesContainer");
        const altList = document.getElementById("alternativesList");

        if (data.alternatives && data.alternatives.length > 0) {
            altContainer.classList.remove("hidden");
            altList.innerHTML = data.alternatives.map(alt => `
                <div class="dashboard-card" style="padding:15px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <span style="font-weight:600; color:var(--text-main); display:block;">${alt.role}</span>
                            <span style="font-size:0.8rem; color:var(--text-muted);"><i class="ph-bold ph-lightning"></i> Only ${alt.missing_count} skills to learn</span>
                        </div>
                        <span style="font-size:1.1rem; color:var(--success-color); font-weight:700;">${alt.match_score}%</span>
                    </div>
                    <div style="width:100%; height:4px; background:rgba(255,255,255,0.1); margin-top:10px; border-radius:2px;">
                        <div style="width:${alt.match_score}%; height:100%; background:var(--success-color); border-radius:2px; box-shadow:0 0 5px var(--success-color);"></div>
                    </div>
                </div>
            `).join("");
        } else {
            altContainer.classList.add("hidden");
        }

        // 3. Render Market Data (Via "External" API)
        try {
            const marketRes = await fetch(`/api/market_data/${career}`);
            const marketData = await marketRes.json();
            renderMarketData(marketData);
        } catch (e) {
            console.error("Market API Error:", e);
            renderMarketData({});
        }

        // 4. Render Roadmap (with animation delay)
        renderRoadmap(data.roadmap, data.missing_skills);

        // 5. Save Analysis (Auto-save)
        saveAnalysis(data.career, data.missing_skills.length, data.missing_skills.length + currentSkills.length);

    } catch (error) {
        console.error("Error:", error);
        scanOverlay.classList.add("hidden");
        alert("DATA LINK FAILED. RETRYING...");
    }
});

function renderMarketData(marketData) {
    const container = document.getElementById("marketData");
    if (!marketData || Object.keys(marketData).length === 0) {
        container.classList.add("hidden");
        return;
    }
    container.classList.remove("hidden");
    // Updated HUD Display: Removed Demand Volume, Added Indian Data
    // We adjust grid columns since there are now only 2 items
    container.style.gridTemplateColumns = "1fr 1fr";

    // Extract numerical values for animation
    // Salary: "₹11,20,000" -> 1120000
    // Growth: "+28.3%" -> 28.3

    container.innerHTML = `
        <div class="market-stat dynamic-entry" style="animation-delay: 0.1s;">
            <h4 style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">AVG Salary (India)</h4>
            <p id="salaryVal" style="font-size:1.4rem; color:var(--text-main); font-weight:700;">${marketData.avg_salary || "N/A"}</p>
        </div>
        <div class="market-stat dynamic-entry" style="animation-delay: 0.2s; border-left:1px solid rgba(255,255,255,0.1);">
            <h4 style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Projected Growth</h4>
            <p id="growthVal" style="font-size:1.4rem; color:var(--success-color); font-weight:700;">${marketData.growth_rate || "N/A"}</p>
        </div>
    `;

    // Animate opacity classes manually if needed, but CSS handles standard entry
    // We could add a sophisticated number scrambler here if desired, 
    // but for now the slide-in + hover effect covers the "dynamic" request efficiently.
}

function renderRoadmap(roadmap, missingSkills) {
    const container = document.getElementById("roadmapContainer");
    if (!roadmap || roadmap.length === 0) {
        container.innerHTML = "<p style='color:var(--text-muted);'>TACTICAL PLAN UNAVAILABLE.</p>";
        return;
    }

    container.innerHTML = roadmap.map((step, index) => {
        // We remove the left border from individual items because the 'roadmap-timeline' container now has the animated line
        return `
            <div class="roadmap-step" id="step-${index}" style="padding-left:20px; position:relative; margin-bottom:20px;">
                <div style="position:absolute; left:-6px; top:0; width:12px; height:12px; background:var(--primary-color); border-radius:50%; box-shadow:0 0 10px var(--primary-color); z-index:2;"></div>
                <h5 style="color:var(--primary-color); margin-bottom:5px;">PHASE 0${step.step}: ${step.topic}</h5>
                <p style="font-size:0.9rem; color:var(--text-muted);">${step.description}</p>
            </div>
        `;
    }).join("");

    // Trigger Animations
    setTimeout(() => {
        container.classList.add("animate"); // Draws the line
        roadmap.forEach((_, index) => {
            setTimeout(() => {
                const el = document.getElementById(`step-${index}`);
                if (el) el.classList.add("visible");
            }, index * 200); // 200ms stagger
        });
    }, 100);
}

async function saveAnalysis(role, missingCount, totalSkills) {
    try {
        await fetch("/api/save_analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role, missing_count: missingCount, total_skills: totalSkills })
        });
    } catch (e) {
        console.log("Failed to archive session.");
    }
}

// Resume Logic Toggle
window.onclick = (event) => {
    // Handle Settings Modal click-outside
    const settingsModal = document.getElementById("settingsModal");
    if (settingsModal && event.target == settingsModal) {
        settingsModal.classList.add("hidden");
    }
};

window.toggleResumeSection = () => {
    const section = document.getElementById('resumeSection');
    const icon = document.getElementById('resumeToggleIcon');
    if (section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        icon.classList.remove('ph-caret-down');
        icon.classList.add('ph-caret-up');
    } else {
        section.classList.add('hidden');
        icon.classList.remove('ph-caret-up');
        icon.classList.add('ph-caret-down');
    }
};

// Simple file handle stub (actual logic would require backend integration for parsing)
window.handleFileSelect = (input) => {
    const fileName = document.getElementById('fileName');
    if (input.files && input.files[0]) {
        fileName.textContent = "> RECEIVED: " + input.files[0].name;
    }
}
window.handleDrop = (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    const fileName = document.getElementById('fileName');
    if (files && files[0]) {
        fileName.textContent = "> RECEIVED: " + files[0].name;
    }
}

// --- SETTINGS MODAL LOGIC (NEW) ---
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");

if (settingsBtn) {
    settingsBtn.addEventListener("click", async () => {
        // Load current data
        try {
            const res = await fetch('/api/user_info');
            if (res.ok) {
                const data = await res.json();
                document.getElementById('settingsUsername').value = data.username;
                document.getElementById('settingsEmail').value = data.email;
            }
        } catch (e) {
            console.error(e);
        }

        settingsModal.classList.remove("hidden");
        document.getElementById("settingsPassword").value = ""; // Always clear password
    });
}

if (closeSettings) {
    closeSettings.addEventListener("click", () => {
        settingsModal.classList.add("hidden");
    });
}

const settingsForm = document.getElementById("settingsForm");
if (settingsForm) {
    settingsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("saveSettingsBtn");
        const originalText = btn.innerHTML;

        btn.disabled = true;
        btn.innerHTML = `<i class="ph-bold ph-spinner ph-spin"></i> UPDATING...`;

        const username = document.getElementById('settingsUsername').value;
        const email = document.getElementById('settingsEmail').value;
        const password = document.getElementById('settingsPassword').value;

        try {
            const res = await fetch('/api/update_profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();

            if (res.ok) {
                btn.innerHTML = `<i class="ph-bold ph-check"></i> SUCCESS`;
                setTimeout(() => {
                    settingsModal.classList.add("hidden");
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 1000);
            } else {
                alert("Error: " + data.error);
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } catch (e) {
            console.error(e);
            alert("Update failed.");
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}
