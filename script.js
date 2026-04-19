document.getElementById("fileInput").addEventListener("change", function () {
    const file = this.files[0];

    const box = document.querySelector(".upload-box");

        if (file) {
            document.getElementById("fileName").textContent = "Selected: " + file.name;
            box.classList.add("active");
        } else {
            document.getElementById("fileName").textContent = "";
            box.classList.remove("active");
        }
    });

async function uploadFile() {

    const fileInput = document.getElementById("fileInput");
    const output = document.getElementById("result")

    const button = document.getElementById("uploadBtn");

    output.textContent = "";

    const file = fileInput.files[0];


    if (!file) {
        output.innerHTML = `<p class="error">⚠️ Please select a file first</p>`;
        return;
    }

    const role = document.getElementById("roleSelect").value;

    if (!role) {
    output.innerHTML = `<p class="error">⚠️ Please select a role</p>`;
    return;
    }


    output.innerHTML = `
    <div class="result-card" style="text-align:center;">
        <div class="loader"></div>
        <p>Analyzing your resume...</p>
    </div>
    `;

    button.disabled = true;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("role", role);


    try {
        const response = await fetch("https://resume-analyzer-asbi.onrender.com/upload", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            output.textContent = "Error: " + (errorData.error || "Something went wrong");
            return;
        }

        const data = await response.json();

        let scoreColor = "#5b6cff";

        if (data.Score >= 75) {
            scoreColor = "#22c55e";
        } else if (data.Score >= 50) {
            scoreColor = "#f59e0b";
        } else {
            scoreColor = "#ef4444";
        }
    

    if (data.error) {
    output.innerHTML = `
    <div class="result-card" style="text-align:center;">
        <p class="error">❌ ${data.error}</p>
    </div>
    `;
    return;
    }

    output.innerHTML = `
    <div class="result-card dashboard">

        <div class="left-panel">

            <div class="score-box">
                <div class="score-circle" style="background: conic-gradient(${scoreColor} ${data.Score}%, #e5e7eb ${data.Score}%); color: ${scoreColor};">
                    <span>${data.Score}</span>
                </div>
                <p>Resume Score</p>
                    <p class="score-label">
                        ${data.Score >= 80 ? "Excellent Match" : 
                        data.Score >= 60 ? "Good Match" : 
                        "Needs Improvement"}
                    </p>
            </div>

            <div class="job-match-box">
                <h3>Job Match</h3>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${data.keyword_analysis.match_percent}%"></div>
                    </div>
                    <p>${data.keyword_analysis.match_percent}% Match</p>
            </div>

        </div>

        <div class="right-panel">

            <div class="section">
                <h3>Matched Skills</h3>
                <div class="skills">
                    ${data.skills["matched skills"].map(skill => 
                        `<span class="matched">${skill}</span>`).join("")}
                </div>
            </div>

            <div class="section">
                <h3>Missing Skills</h3>
                
                <div class="skills">
                    ${data.skills["missing skills"].map(skill => 
                        `<span class="missing">${skill}</span>`).join("")}
                </div>
            </div>

            <div class="section">
                <div class="section suggestions-section">
                    <h3>Suggestions</h3>

                    <div class="suggestions-box">
                        ${data.suggestions.map(s => `
                            <div class="suggestion-item">
                                ${s}
                            </div>
                        `).join("")}
                    </div>

                    <button class="download-btn" id="downloadBtn">
                        Download Report
                    </button>
                        

                </div>
            </div>

            <div class="section">
                <h3>Missing Keywords</h3>
                <div class="skills">
                    ${data.keyword_analysis.missing_keywords.map(k => 
                        `<span class="missing">${k}</span>`).join("")}
                </div>
            </div>

        </div>

    </div>
    `;
        
    setTimeout(() => {
    document.getElementById("downloadBtn").onclick = function() {
        downloadReport(data);
    };
    }, 0);

    } catch (error) {
    output.innerHTML = `
    <div class="result-card" style="text-align:center;">
        <p class="error">❌ ${error}</p>
    </div>
    `;
    }

    finally {
    button.disabled = false;
    }
        
}

function resetUI() {
    document.getElementById("fileInput").value = "";
    document.getElementById("fileName").textContent = "";
    document.getElementById("result").innerHTML = "";
    document.getElementById("uploadBtn").disabled = false;
    
}

function downloadReport(data) {
    alert("Download clicked");

    const report = `
RESUME ANALYSIS REPORT
----------------------

Role: ${data.role || "N/A"}
Score: ${data.Score || 0}/100
Job Match: ${data.keyword_analysis?.match_percent || 0}%

----------------------
MATCHED SKILLS:
${data.skills?.["matched skills"]?.join(", ") || "None"}

----------------------
MISSING SKILLS:
${data.skills?.["missing skills"]?.join(", ") || "None"}

----------------------
SUGGESTIONS:
${data.suggestions?.map(s => "- " + s).join("\n") || "None"}

----------------------
Generated by Resume Analyzer
`;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "resume_report.txt";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}