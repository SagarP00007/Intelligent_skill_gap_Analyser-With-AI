
// Resume Section Toggle
function toggleResumeSection() {
	const section = document.getElementById("resumeSection");
	const icon = document.getElementById("resumeToggleIcon");
	section.classList.toggle("hidden");

	if (section.classList.contains("hidden")) {
		icon.classList.remove("ph-caret-up");
		icon.classList.add("ph-caret-down");
	} else {
		icon.classList.remove("ph-caret-down");
		icon.classList.add("ph-caret-up");
	}
}

// File Drag & Drop Handlers
document.getElementById('dropZone').addEventListener('click', () => {
	document.getElementById('resumeFile').click();
});

function handleFileSelect(input) {
	if (input.files && input.files[0]) {
		document.getElementById('fileName').innerText = input.files[0].name;
	}
}

function handleDrop(event) {
	event.preventDefault();
	if (event.dataTransfer.files && event.dataTransfer.files[0]) {
		const fileInput = document.getElementById('resumeFile');
		fileInput.files = event.dataTransfer.files;
		handleFileSelect(fileInput);
	}
}

// Extract Skills Handler
document.getElementById("extractSkillsBtn").addEventListener("click", async () => {
	// Check for file first
	const fileInput = document.getElementById('resumeFile');
	const btn = document.getElementById("extractSkillsBtn");
	const loading = document.getElementById("extractLoading");

	let formData = new FormData();
	let hasContent = false;

	if (fileInput.files && fileInput.files[0]) {
		formData.append('file', fileInput.files[0]);
		hasContent = true;
	}
	/* 
	// Legacy support for text area if you want to keep it as fallback, 
	// but for now UI only shows file input.
	else {
		// alert("Please select a file.");
		// return;
	} 
	*/

	if (!hasContent) {
		alert("Please upload a resume file first.");
		return;
	}

	// UI: Loading
	btn.disabled = true;
	loading.classList.remove("hidden");

	try {
		const response = await fetch("/api/extract_skills", {
			method: "POST",
			body: formData // Fetch automatically sets Content-Type to multipart/form-data
		});

		const data = await response.json();

		if (data.skills && data.skills.length > 0) {
			let addedCount = 0;
			data.skills.forEach(skillName => {
				// Check if already exists
				if (!currentSkills.some(s => s.name.toLowerCase() === skillName.toLowerCase())) {
					// Default to Intermediate level for extracted skills
					currentSkills.push({ name: skillName, level: "Intermediate" });
					addedCount++;
				}
			});

			renderSkills();

			if (addedCount > 0) {
				alert(`Successfully extracted and added ${addedCount} skills!`);
				document.getElementById("resumeSection").classList.add("hidden"); // Auto-close on success
				document.getElementById("resumeToggleIcon").classList.add("ph-caret-down");
				document.getElementById("resumeToggleIcon").classList.remove("ph-caret-up");
				// Reset file input
				fileInput.value = "";
				document.getElementById('fileName').innerText = "";
			} else {
				alert("Skills found but they are already in your list.");
			}
		} else {
			alert("No matching skills found in the file. Try adding them manually.");
		}

	} catch (error) {
		console.error("Extraction error:", error);
		alert("Failed to extract skills. Please try again or check the file format.");
	} finally {
		btn.disabled = false;
		loading.classList.add("hidden");
	}
});
