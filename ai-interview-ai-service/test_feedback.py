import requests
import json
import uuid

# Configuration
API_URL = "http://127.0.0.1:8000/finalize_decision"
SESSION_ID = str(uuid.uuid4())
USER_ID = "test-admin-user"

# 1. Mock Resume Context
resume_text = """
Candidate: Alex Chen
Role: Backend Engineer
Skills: Python, Django, AWS, PostgreSQL, Redis.
Experience: 
- Built a real-time chat application using WebSockets.
- Optimized database queries reducing latency by 40%.
"""

# 2. Mock Question History (Mixed Performance)
# We purposely include a weak answer to see if the AI picks it up.
mock_history = [
    {
        "question": "Explain the difference between a process and a thread in Python.",
        "answer": "A process is an instance of a program, while a thread is an entity within a process. In Python, threads are limited by the GIL, so they are better for I/O tasks, while processes are better for CPU heavy tasks.",
        "score": 0.90,
        "type": "conceptual",
        "result": {
            "technical_diagnosis": {
                "win": "Clear explanation of GIL impact.",
                "gap": None
            }
        }
    },
    {
        "question": "How did you implement the real-time chat feature mentioned in your resume?",
        "answer": "I used Django Channels and Redis. We had some issues with scaling but we fixed it by adding more servers.",
        "score": 0.75,
        "type": "project_discussion",
        "result": {
            "technical_diagnosis": {
                "win": "Correct tech stack selection.",
                "gap": "Vague on specific scaling strategies (horizontal vs vertical)."
            }
        }
    },
    {
        "question": "Write a function to detect a cycle in a linked list.",
        "answer": "I would just iterate through the list and keep a count. If the count goes too high, there is a cycle.",
        "score": 0.35,
        "type": "coding_challenge",
        "result": {
            "technical_diagnosis": {
                "win": "Understands the basic concept of a cycle.",
                "gap": "Inefficient solution. Failed to use Floyd's Cycle-Finding Algorithm (Tortoise and Hare)."
            }
        }
    }
]

# 3. Construct Payload
payload = {
    "request_id": str(uuid.uuid4()),
    "session_id": SESSION_ID,
    "user_id": USER_ID,
    "resume_summary": resume_text,
    "conversation": [], # Not needed for decision logic usually
    "question_history": mock_history,
    "token_budget": 2000,
    "allow_pii": False,
    "accept_model_final": True
}

def test_final_decision():
    print(f"🚀 Sending request to {API_URL}...")
    print(f"📊 Mocking {len(mock_history)} questions with mixed scores...")
    
    try:
        response = requests.post(API_URL, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            
            # Extract parsed result
            result_data = data.get("result", {}).get("parsed", {})
            if not result_data:
                # Fallback if structure is flat
                result_data = data.get("result", {})

            print("\n✅ API RESPONSE RECEIVED")
            print("=" * 60)
            print(f"⚖️  FINAL VERDICT:      {result_data.get('verdict', 'N/A').upper()}")
            print(f"🔢 CONFIDENCE:         {result_data.get('confidence', 0.0)}")
            print(f"👤 RECOMMENDED ROLE:   {result_data.get('recommended_role', 'N/A')}")
            print("-" * 60)
            print("📝 FEEDBACK SUMMARY:\n")
            print(result_data.get('feedback_summary', "No summary provided."))
            print("-" * 60)
            print("💪 STRENGTHS:")
            for s in result_data.get('key_strengths', []):
                print(f"   - {s}")
            print("\n⚠️ WEAKNESSES:")
            for w in result_data.get('critical_weaknesses', []):
                print(f"   - {w}")
            print("=" * 60)
            
            # Validation check
            summary = result_data.get('feedback_summary', "")
            if "Completed with strong performance" in summary:
                print("\n❌ FAILURE: Still receiving the generic hardcoded summary.")
            else:
                print("\n✅ SUCCESS: Summary appears to be AI-generated.")

        else:
            print(f"\n❌ Error {response.status_code}:")
            print(response.text)

    except Exception as e:
        print(f"\n❌ Connection Failed: {e}")
        print("Make sure your FastAPI server is running on port 8000.")

if __name__ == "__main__":
    test_final_decision()