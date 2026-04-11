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

    output.innerHTML = `
    <div class="result-card" style="text-align:center;">
        <div class="loader"></div>
        <p>Analyzing your resume...</p>
    </div>
    `;

    button.disabled = true;

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("http://127.0.0.1:8000/upload", {
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
    <div class="result-card">

        <div class="top-section">

        <div class="score-box">
            <div class="score-circle" style="background: conic-gradient(${scoreColor} ${data.Score}%, #e5e7eb ${data.Score}%); color: ${scoreColor};">
                <span>${data.Score}</span>
            </div>
            <p>Out of 100</p>
        </div>

        <div class="user-info">
            <h2>Role: ${data.role}</h2>
            <p class="email">Email: ${data.basic_info.email || "Not found"}</p>
            <span class="badge">Resume Analysis</span>
        </div>

        </div>

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
            <h3>Suggestions</h3>
            <ul>
                ${data.suggestions.map(s => `<li>${s}</li>`).join("")}
            </ul>
        </div>

        <button onclick="resetUI()" class="secondary-btn">
        Analyze Another Resume
        </button>

    </div>
    `;

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