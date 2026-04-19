import re
from fastapi import FastAPI
from fastapi import UploadFile, File
import pdfplumber
from fastapi.middleware.cors import CORSMiddleware

def normalize(text):
    return text.lower().strip()

def get_ai_suggestions():
    return "Improve project impact, add metrics, and highlight tech stack clearly."


def extract_keywords(text):
    words = re.findall(r"\b[a-zA-Z]{2,}\b", text.lower())

    stopwords = {
        "the", "and", "for", "with", "you", "your",
        "are", "this", "that", "have", "will", "from",
        "a", "an", "to", "of", "in", "on"
    }

    keywords = [w for w in words if w not in stopwords]

    return list(set(keywords))



SYNONYMS = {
    "ui design": ["visual design", "interface design"],
    "javascript": ["js"],
    "machine learning": ["ml"]
    }

ROLE_SKILLS = {
    "frontend": [
        "javascript", "typescript", "html", "css",
        "react", "next", "tailwind", "redux"
    ],
    
    "backend": [
        "python", "java", "node", "sql",
        "fastapi", "django", "express", "rest api"
    ],
    
    "fullstack": [
        "javascript", "typescript", "react", "node",
        "sql", "api", "git"
    ],
    
    "data": [
        "python", "sql", "pandas", "numpy",
        "machine learning", "data analysis"
    ],
    
    "uiux": [
        "figma", "ui design", "ux design",
        "wireframing", "prototyping", "user research"
    ],
    
    "general": [
        "html", "css", "git"
    ]
}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return{"message" : "Welcome"}

@app.get("/test")
def test():
    return {"message": "API is running"}

from fastapi import Form

@app.post("/upload")
def upload_file(
    file: UploadFile = File(...),
    role: str = Form(...)
):

    if file.content_type != "application/pdf":
        return {"error": "Only PDF files allowed"}

    file.file.seek(0)

    text = ""

    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    text_lower = text.lower()

    if not text.strip():
        return {"error": "No text could be extracted from the PDF"}
    
    resume_keywords = extract_keywords(text)

    required_skills = ROLE_SKILLS.get(role, [])


    for key, values in SYNONYMS.items():
        for val in values:
            if val in text_lower:
                text_lower += " " + key

    lines = re.split(r"[|,]", text)


    email = None

    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",text)

    if match:
        email = match.group(0)

    matched_skills = []
    missing_skills = []

    for skill in required_skills:
        found = False

        # direct match
        if re.search(rf"\b{re.escape(skill.lower())}\b", text_lower):
            found = True

        # synonym match
        elif skill in SYNONYMS:
            for synonym in SYNONYMS[skill]:
                if synonym in text_lower:
                    found = True
                    break

        if found:
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)

    if len(required_skills) > 0:
        match_percent = int((len(matched_skills) / len(required_skills)) * 100)
    else:
        match_percent = 0

    header = [line.strip() for line in lines if line.strip()][:3]

    
    strong_words = ["intern", "company", "worked", "experience"]
    project_count = text_lower.count("project")

    if any(word in text_lower for word in strong_words):
        experience_score = 30
        experience_found = True
    elif project_count >= 3:
        experience_score = 15
        experience_found = True
    else:
        experience_score = 0
        experience_found = False

    # sugestions
    suggestions = []
    if not email:
        suggestions.append("Add professional Email")

    if len(matched_skills) == 0:
        suggestions.append("Add relevant technical skills")
    
    if len(missing_skills) > 0:
        suggestions.append(f"For {role} role, you're missing key skills: {', '.join(missing_skills[:5])}")

    if text_lower.count("project") < 2:
        suggestions.append("Add 1–2 more projects with clear impact (metrics, users, performance) and tech stack")

    if not experience_found:
        suggestions.append("Add experience with impact (what you built, results, technologies used)")
    
    if len(text) < 500:
        suggestions.append("Improve project descriptions: mention problem, solution, tech, and measurable results")

        # role-based suggestions
    if role == "uiux":
        portfolio_keywords = ["portfolio", "framer", "behance", "dribbble",".com", ".media"]
        has_portfolio = any(word in text_lower for word in portfolio_keywords)

        if not has_portfolio:
            suggestions.append("Add a portfolio (Framer/Behance) with 2–3 detailed case studies")

    elif role in ["frontend", "backend", "fullstack"]:
        if "github" not in text_lower:
            suggestions.append("Add GitHub with 2–3 strong projects and clean README")


    if len(matched_skills) >= 5:
        skill_score = 40
    elif len(matched_skills) >= 3:
        skill_score = 25
    elif len(matched_skills) >= 1:
        skill_score = 10
    else:
        skill_score = 0

    content_score = 0
    if len(text) > 700:
        content_score += 15
    
    if text_lower.count("project")>= 2:
        content_score += 10

    penalty = 0

    # UI/UX roles should have Portfolio
    portfolio_keywords = ["portfolio", "framer", "behance", "dribbble"]
    has_portfolio = any(word in text_lower for word in portfolio_keywords)

    if role == "uiux" and not has_portfolio:
        penalty += 15

    # Dev roles should have GitHub
    if role in ["frontend", "backend", "fullstack"] and "github" not in text_lower:
        penalty += 10

    total_score = skill_score + experience_score + content_score - penalty
    total_score = max(total_score, 0)

    # normalize to 100
    total_score = int((total_score / 95) * 100)

    ai_output = get_ai_suggestions()

    return{ "header": header,
            "basic_info": { 
                "email": email
            },
            "keyword_analysis": {
            "match_percent": match_percent,
            "matched_keywords": matched_skills[:20],
            "missing_keywords": missing_skills[:20]
            },
            "skills": 
                {"matched skills": matched_skills ,
                "missing skills": missing_skills},
            "role": role,
            "experience": experience_found,
            "required_skills": required_skills,
            "suggestions" : suggestions,
            "Score" : total_score,
            "preview" : text[:200],


            "ai_insights": ai_output

            }
