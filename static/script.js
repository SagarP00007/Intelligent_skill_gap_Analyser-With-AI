document.getElementById("analyzeBtn").addEventListener("click", async () => {
    const career = document.getElementById("career").value;
    const skills = document.getElementById("skills").value;

    const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ career, skills })
    });

    const data = await response.json();
    const resultDiv = document.getElementById("result");

    if (data.missing_skills.length === 0) {
        resultDiv.innerHTML = `<p>✅ You already have all the skills required for a ${data.career}!</p>`;
    } else {
        resultDiv.innerHTML = `
            <p>🔍 Missing Skills: <b>${data.missing_skills.join(", ")}</b></p>
            <p>📘 Recommended Learning Path:</p>
            <ul>${data.recommendations.map(r => `<li>${r}</li>`).join("")}</ul>
        `;
    }
});
