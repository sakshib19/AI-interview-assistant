"""Application entrypoint."""
import os
from fastapi.middleware.cors import CORSMiddleware

from core.config import app
from api.routes import router

# 1. CORS Setup
# It's best practice to use an environment variable for your frontend domain.
# This defaults to your local Next.js environment if the variable isn't set.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "*"], # Note: Remove "*" once your Vercel site is live!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(router)

# Health route
@app.get("/health")
def health():
    return {
        "status": "ok", 
        "message": "AI Interviewer Backend is running successfully!"
    }

if __name__ == "__main__":
    import uvicorn
    
    # 2. HUGGING FACE PORT
    # Hugging Face Docker Spaces strictly require the app to run on port 7860.
    uvicorn.run(app, host="0.0.0.0", port=7860)