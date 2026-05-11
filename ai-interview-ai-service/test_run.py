import json
from services.runtime import run_code_in_sandbox
from services.common import llm_call

def test_full_flow():
    # ==========================================
    # CHOOSE YOUR SCENARIO (1, 2, or 3)
    # ==========================================
    SCENARIO_TO_RUN = 2  

    if SCENARIO_TO_RUN == 1:
        # Scenario 1: Basic Python (Perfect Solution)
        language = "python"
        question = "Write a Python function that takes a number and returns its square. The program should read from stdin."
        student_code = "import sys\nn = int(sys.stdin.read())\nprint(n * n)"
        test_input = "6"
        expected_output = "36"

    elif SCENARIO_TO_RUN == 2:
        # Scenario 2: Python Palindrome (Contains a logical bug - case sensitivity)
        language = "python"
        question = "Write a Python script that reads a string from stdin and prints 'True' if it is a palindrome, ignoring case. Otherwise, print 'False'."
        student_code = "import sys\ns = sys.stdin.read().strip()\nprint(str(s == s[::-1]))"
        test_input = "Racecar" 
        expected_output = "True"

    elif SCENARIO_TO_RUN == 3:
        # Scenario 3: C++ Factorial (Perfect Solution)
        language = "cpp"
        question = "Write a C++ program that reads an integer from stdin and prints its factorial."
        student_code = """#include <iostream>
using namespace std;
int main() {
    int n;
    long long fact = 1;
    cin >> n;
    for(int i = 1; i <= n; i++) fact *= i;
    cout << fact;
    return 0;
}"""
        test_input = "5"
        expected_output = "120"


    print(f"🚀 Step 1: Running {language.upper()} code securely via Glot.io...")
    
    # 2. Execute Code
    execution_result = run_code_in_sandbox(language, student_code, stdin=test_input)

    # Check if the API call itself failed or if there was a hard runtime crash
    if not execution_result["success"] and execution_result.get("error_type") == "API Error":
        print(f"❌ Execution Engine Failed: {execution_result['output']}")
        return

    actual_output = execution_result["output"]
    
    if execution_result.get("error_type"):
        print(f"⚠️ Code Executed with Errors:\n{actual_output}")
    else:
        print(f"✅ Code Output: {actual_output}")

    # 3. AI Evaluation
    print("\n🤖 Step 2: Sending results to AI for evaluation...")
    
    eval_prompt = f"""
    SYSTEM: You are a Senior Technical Interviewer.
    
    USER QUESTION: {question}
    STUDENT CODE: 
    {student_code}
    
    EXECUTION RESULTS:
    - Input: {test_input}
    - Expected Output: {expected_output}
    - Actual Output: {actual_output}
    
    TASK: Provide a brief feedback (1-2 sentences) and a status (PASSED/FAILED).
    """

    ai_response = llm_call(eval_prompt)
    print("\n--- AI FEEDBACK ---")
    print(ai_response.get("raw", "No response from AI"))

if __name__ == "__main__":
    test_full_flow()