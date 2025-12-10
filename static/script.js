document.getElementById("analyzeBtn").addEventListener("click", async () => {
    const career = document.getElementById("career").value;
    const skills = document.getElementById("skills").value.trim();
    const resultDiv = document.getElementById("result");
    const loadingDiv = document.getElementById("loading");
    const btn = document.getElementById("analyzeBtn");

    // Validation
    if (!career || !skills) {
        alert("Please select a career role and enter your current skills.");
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
            body: JSON.stringify({ career, skills })
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
