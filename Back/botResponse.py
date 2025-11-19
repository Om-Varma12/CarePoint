# botResponse.py
import json
from typing import List, Dict
from openai import OpenAI
from difflib import SequenceMatcher

# Initialize OpenAI client with Hugging Face router
client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key="your_api_here"
)

# Load medicines data ONCE at module level
try:
    with open('medicines_intents.json', 'r', encoding='utf-8') as f:
        MEDICINES_DATA = json.load(f)['medicines']
    print(f"✅ Loaded {len(MEDICINES_DATA)} medicines")
except FileNotFoundError:
    print("⚠️ medicines_intents.json not found")
    MEDICINES_DATA = []
except Exception as e:
    print(f"❌ Error loading medicines data: {str(e)}")
    MEDICINES_DATA = []


def calculate_similarity(query: str, use_case: str) -> float:
    """Calculate similarity between user query and medicine use case"""
    query_lower = query.lower().strip()
    use_case_lower = use_case.lower().strip()
    
    # Direct match
    if use_case_lower in query_lower or query_lower in use_case_lower:
        return 1.0
    
    # Word overlap
    query_words = set(query_lower.split())
    use_case_words = set(use_case_lower.split())
    
    # Remove common stopwords
    stopwords = {'i', 'have', 'am', 'is', 'the', 'a', 'an', 'my', 'me'}
    query_words = query_words - stopwords
    use_case_words = use_case_words - stopwords
    
    if len(query_words) == 0 or len(use_case_words) == 0:
        return 0.0
    
    overlap = len(query_words & use_case_words)
    total = len(query_words | use_case_words)
    
    word_similarity = overlap / total if total > 0 else 0.0
    
    # Sequence matching
    sequence_similarity = SequenceMatcher(None, query_lower, use_case_lower).ratio()
    
    # Combine both scores
    return (word_similarity * 0.6) + (sequence_similarity * 0.4)


def find_matching_medicines(query: str, threshold: float = 0.35) -> List[Dict]:
    """Find medicines that match the user's query"""
    matches = []
    
    for medicine in MEDICINES_DATA:
        best_match_score = 0.0
        best_use_case = ""
        
        for use_case in medicine['use_cases']:
            similarity = calculate_similarity(query, use_case)
            
            if similarity > best_match_score:
                best_match_score = similarity
                best_use_case = use_case
        
        if best_match_score >= threshold:
            matches.append({
                'medicine': medicine,
                'similarity_score': best_match_score,
                'matched_use_case': best_use_case
            })
    
    matches.sort(key=lambda x: x['similarity_score'], reverse=True)
    return matches


def format_medicine_recommendation(medicine_data: Dict) -> str:
    """Format medicine information into a readable recommendation"""
    med = medicine_data['medicine']
    
    recommendation = f"""💊  {med['medicine_name']} 

📋  Dosage:  {med['dosage']}

⏰  How to take:  {med['frequency']}

⚠️  Important Precautions: 
{med['precautions']}

---
 ⚕️ Medical Disclaimer:  This is a general recommendation. Always consult with a healthcare professional before taking any medication, especially if you have existing conditions or take other medications."""
    
    return recommendation.strip()


def get_bot_response(conversation_history: List[Dict[str, str]]) -> Dict[str, any]:
    """Generate AI bot response based on conversation history"""
    try:
        # Check message limit
        if len(conversation_history) >= 20:
            return {
                "response": "I've reached the conversation limit for this chat. Please start a new conversation to continue our discussion.",
                "medicines": []
            }
        
        print(f"\n🤖 Processing conversation with {len(conversation_history)} messages")
        
        # Get the latest user message
        latest_message = ""
        for msg in reversed(conversation_history):
            if msg['sender'] == 'user':
                latest_message = msg['message']
                break
        
        print(f"🔍 Checking for medicine matches in: {latest_message[:100]}")
        
        # Find matching medicines
        matching_medicines = find_matching_medicines(latest_message)
        
        medicine_recommendations = []
        if matching_medicines:
            print(f"💊 Found {len(matching_medicines)} matching medicine(s)")
            
            # Take top 2 matches with score > 0.5
            top_matches = [m for m in matching_medicines if m['similarity_score'] > 0.5][:2]
            
            for match in top_matches:
                medicine_recommendations.append(format_medicine_recommendation(match))
                print(f"   ✓ {match['medicine']['medicine_name']} (score: {match['similarity_score']:.2f})")
        else:
            print("ℹ️ No matching medicines found")
        
        # Build messages for LLM
        messages = build_llm_messages(conversation_history)
        
        print(f"📤 Sending {len(messages)} messages to LLM")
        
        # Call LLM API
        completion = client.chat.completions.create(
            model="m42-health/Llama3-Med42-8B:featherless-ai",
            messages=messages,
            max_tokens=500,
            temperature=0.7,
        )
        
        response = completion.choices[0].message.content
        print(f"✅ LLM Response generated successfully")
        
        return {
            "response": response,
            "medicines": medicine_recommendations
        }

    except Exception as e:
        print(f"❌ Error in get_bot_response: {str(e)}")
        return {
            "response": "I apologize, but I'm experiencing some technical difficulties right now. Could you please rephrase your question or try again in a moment?",
            "medicines": []
        }


def build_llm_messages(conversation_history: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """Build messages array for LLM API call"""
    system_prompt = """You are CarePoint Assistant, a compassionate healthcare chatbot for college students.

Your role covers:
1. General healthcare guidance
2. College health and wellbeing
3. Emergency triage and urgent advice

Rules:
- Be empathetic, calm, and professional
- Keep answers short (2-4 sentences), clear, and easy to understand
- Use plain, caring language and avoid jargon
- Provide evidence-based information and self-care guidance
- DO NOT mention specific medicine names in your response
- Focus on education, prevention, and support – not diagnosis

Emergency Handling:
- For critical symptoms (chest pain, breathing trouble, severe bleeding, loss of consciousness), instruct them to call emergency services immediately
- For urgent but non-life-threatening issues, suggest urgent care or campus health

College Context:
- Give health tips, stress/sleep advice
- Direct users toward campus or student health services when relevant
- Offer 2-3 actionable next steps

Behavior:
- Never reveal you are an AI
- Remain polite, supportive, and concise
- If asked about topics outside healthcare/college wellbeing/emergency guidance, politely respond: "I wasn't trained on that domain, so I may not have the best information for your question."
"""

    messages = [{"role": "system", "content": system_prompt}]
    
    # Add conversation history
    for msg in conversation_history:
        role = "user" if msg['sender'] == 'user' else "assistant"
        messages.append({
            "role": role,
            "content": msg['message']
        })
    
    return messages