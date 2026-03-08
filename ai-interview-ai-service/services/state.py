"""Interview state container and session state registry."""

from typing import Any, Dict, List

from core.config import INTERVIEW_ROUNDS, QUESTION_TYPE_TO_ROUND
from services.common import is_repetitive_question
from services.projects import extract_projects_smart

class InterviewState:
    """
    Stateless Interview Manager with Advanced Analytics.
    Re-calculates coverage, stability, and gaps from history.
    """

    def __init__(self, resume_text: str):
        self.resume_text = resume_text
        self.projects = extract_projects_smart(resume_text)
        
        # Coverage & Flow
        self.covered_projects: set[str] = set()
        self.history: List[Dict[str, Any]] = []
        self.visited_topics: set[str] = set()
        self.difficulty_level = "medium"
        self.completed_types: set[str] = set()

        
        # Analytics (NEW)
        self.topic_scores: Dict[str, List[float]] = {}  # { "hashing": [0.8, 0.4] }
        self.gap_counts: Dict[str, int] = {}            # { "time_complexity": 3 }

        # Resume signals
        design_keywords = [
            'backend', 'architecture', 'scalable', 'microservices', 
            'distributed', 'api', 'database', 'system', 'design',
            'aws', 'cloud', 'docker', 'server', 'deployment','system_design'
        ]
        self.has_system_design_skills = any(kw in resume_text.lower() for kw in design_keywords)
        self.has_work_experience = any(kw in resume_text.lower() for kw in ["experience", "work history", "employment"])
        self.has_achievements = any(kw in resume_text.lower() for kw in ['achievement', 'award', 'competition'])
        
        # Round State
        self.current_round = "screening"
        self.round_history = {
            "screening": {"questions": [], "scores": [], "status": "in_progress"},
            "technical": {"questions": [], "scores": [], "status": "not_started"},
            "behavioral": {"questions": [], "scores": [], "status": "not_started"}
        }
        self.eliminated = False
        self.elimination_reason = None

    def _update_round_status(self):
        # (Keep existing logic - identical to your current file)
        round_order = ["screening", "technical", "behavioral"]
        for round_name in round_order:
            round_data = self.round_history[round_name]
            round_config = INTERVIEW_ROUNDS[round_name]
            num_questions = len(round_data["questions"])
            scores = round_data["scores"]
            
            if num_questions == 0:
                if round_data["status"] == "not_started": self.current_round = round_name
                return

            if num_questions >= round_config["min_questions"]:
                avg_score = sum(scores) / len(scores) if scores else 0.0
                if avg_score < round_config["pass_threshold"]:
                    self.eliminated = True
                    self.elimination_reason = f"Failed {round_config['name']} (Score: {avg_score:.2f} < {round_config['pass_threshold']:.2f})"
                    round_data["status"] = "failed"
                    return
                round_data["status"] = "passed"
                if num_questions >= round_config["max_questions"]: continue
                self.current_round = round_name
                return
            else:
                self.current_round = round_name
                round_data["status"] = "in_progress"
                return
        self.current_round = "complete"

    def hydrate_from_history(self, history: List[Dict[str, Any]]):
        self.history = history or []
        self.covered_projects.clear()
        self.topic_scores = {}
        self.gap_counts = {}
        self.completed_types.clear()

        
        # Reset rounds
        for r in self.round_history:
            self.round_history[r] = {"questions": [], "scores": [], "status": "not_started"}
        
        self.current_round = "screening"
        self.eliminated = False
        
        raw_scores = []

        for h in self.history:
            # 1. Round Tracking
            q_type = h.get("type", "conceptual")
            if not h.get("is_probe", False):
                round_name = QUESTION_TYPE_TO_ROUND.get(q_type, "screening")
                self.round_history[round_name]["questions"].append(h)
                s = h.get("score")
                if s is not None:
                    try:
                        val = float(s)
                        self.round_history[round_name]["scores"].append(val)
                        raw_scores.append(val)
                        if round_name == "behavioral" and val >= 0.75:
                            self.completed_types.add(q_type)


                    except: pass
                
                target = h.get("target_project")
                if target and target != "general": self.covered_projects.add(target)

            # 2. Analytics (NEW: Parse Technical Diagnosis)
            if "result" in h and isinstance(h["result"], dict):
                diag = h["result"].get("technical_diagnosis", {})
            elif "technical_diagnosis" in h:
                diag = h["technical_diagnosis"]
            else:
                diag = {}

            # A. Track GAP Recurrence
            gap = diag.get("gap", {})
            if gap and gap.get("issue"):
                issue = gap["issue"]
                self.gap_counts[issue] = self.gap_counts.get(issue, 0) + 1

            # B. Track Sub-Topic Stability
            raw_subs = diag.get("sub_topics", [])
            for sub in raw_subs:
                name = sub if isinstance(sub, str) else sub.get("name")
                if name:
                    score = h.get("score", 0)
                    if isinstance(score, dict): score = score.get("overall_score", 0)
                    if name not in self.topic_scores: self.topic_scores[name] = []
                    self.topic_scores[name].append(float(score))

        self._update_round_status()
        
        # Difficulty Adjustment
        if raw_scores:
            avg = sum(raw_scores[-3:]) / len(raw_scores[-3:])
            if avg > 0.8: self.difficulty_level = "hard"
            elif avg < 0.4: self.difficulty_level = "easy"
            else: self.difficulty_level = "medium"

    def next_question_type(self) -> str:
        # (Keep existing logic - identical to your current file)
        if self.eliminated: return "eliminated"
        if self.current_round == "complete": return "complete"
        
        # 2. Setup Context
        round_config = INTERVIEW_ROUNDS[self.current_round]
        round_questions = self.round_history[self.current_round]["questions"]
        q_count = len(round_questions)
        max_q = round_config["max_questions"]
        
        # Get list of previously asked question types (ignoring probes)
        asked_types = [q.get("type") for q in round_questions if not q.get("is_probe", False)]
        
        # ====================================================
        # 🟢 LOGIC FOR TECHNICAL ROUND (The "Sabotage" Trigger)
        # ====================================================
        if self.current_round == "technical":
            # A. First Priority: Standard Coding Challenge
            if "coding_challenge" not in asked_types:
                return "coding_challenge"
            
            # B. Second Priority: System Design (Mid-round)
            # Only if user has skills, hasn't been asked, AND we aren't at the very end
            if "system_design" not in asked_types and self.has_system_design_skills and q_count < max_q - 1:
                return "system_design"

            # C. 🔥 LAST STEP: The Sabotage Round
            # If we are at the LAST allowed question (max_q - 1)
            # OR if we have already asked 3+ questions
            if q_count >= max_q - 1:
                if "debugging" not in asked_types:
                    return "debugging"

        # ====================================================
        # Standard Selection Logic (Screening / Behavioral / Fillers)
        # ====================================================
        focus_areas = round_config["focus"]
        valid_focus_areas = []
        
        # Filter valid topics based on resume signals
        for t in focus_areas:
            if t == "system_design" and not self.has_system_design_skills: continue
            if t == "experience" and not self.has_work_experience: continue
            if t == "achievement" and not self.has_achievements: continue
            # Don't pick debugging randomly; it is handled explicitly above
            if t == "debugging": continue 
            valid_focus_areas.append(t)
        
        # Safety Fallback
        if not valid_focus_areas: 
            valid_focus_areas = ["conceptual"]
            if self.current_round == "technical":
                valid_focus_areas.append("coding_challenge")
        
        # Behavioral Logic: Pick unseen topics
        if self.current_round == "behavioral":
             remaining = [t for t in valid_focus_areas if t not in self.completed_types]
             return remaining[0] if remaining else valid_focus_areas[0]
                
        # General Rotation: Least Used First
        # 1. Try types never asked
        unused = [t for t in valid_focus_areas if t not in asked_types]
        if unused:
            return unused[0]
            
        # 2. Try types asked less than 2 times
        available = [t for t in valid_focus_areas if asked_types.count(t) < 2]
        if available:
            return available[0]
            
        # 3. Fallback to first valid type
        return valid_focus_areas[0]

    def is_question_too_similar(self, new_question: str) -> bool:
        return is_repetitive_question(new_question, self.history)

INTERVIEW_STATE: Dict[str, InterviewState] = {}

def get_interview_state(session_id: str, resume: str) -> InterviewState:
    """
    Returns existing InterviewState for session
    or initializes it from resume text.
    """
    if session_id not in INTERVIEW_STATE:
        INTERVIEW_STATE[session_id] = InterviewState(resume)
    return INTERVIEW_STATE[session_id]

