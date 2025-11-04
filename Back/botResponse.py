# botResponse.py
import os
from typing import List, Dict
from openai import OpenAI

# Initialize OpenAI client with Hugging Face router
client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key="Your_Hugging_Face_API_Key"  # Replace with your actual Hugging Face API key
)

def get_bot_response(conversation_history: List[Dict[str, str]]) -> str:
    """
    Generate AI bot response based on conversation history using LLM
    
    Args:
        conversation_history: List of message dicts with 'sender' and 'message' keys
        
    Returns:
        str: AI generated response
    """
    try:
        # Check message limit (20 messages max)
        if len(conversation_history) >= 20:
            return "I've reached the conversation limit for this chat. Please start a new conversation to continue our discussion. This helps ensure the best quality of responses and prevents information overload."
        
        print(f"🤖 Processing conversation with {len(conversation_history)} messages")
        
        # Build messages for LLM with system prompt and conversation history
        messages = build_llm_messages(conversation_history)
        
        print(f"📤 Sending {len(messages)} messages to LLM")
        
        # Call LLM API
        completion = client.chat.completions.create(
            model="m42-health/Llama3-Med42-8B:featherless-ai",
            messages=messages,
            max_tokens=500,  # Limit response length for conciseness
            temperature=0.7,  # Balanced creativity and consistency
        )
        
        response = completion.choices[0].message.content
        print(f"✅ LLM Response generated successfully")
        
        return response

    except Exception as e:
        print(f"❌ Error in get_bot_response: {str(e)}")
        # Fallback response
        return "I apologize, but I'm experiencing some technical difficulties right now. Could you please rephrase your question or try again in a moment?"


def build_llm_messages(conversation_history: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """
    Build messages array for LLM API call with system prompt and conversation history
    
    Args:
        conversation_history: List of message dicts with 'sender' and 'message' keys
        
    Returns:
        List of message dicts formatted for OpenAI API
    """
    # System prompt to set the assistant's behavior
    system_prompt = """
    
    Your role is to handle three domains:

General healthcare guidance

College-related health and wellbeing

Emergency triage and urgent advice

Follow these universal rules:

Tone & Style:

Be empathetic, calm, and professional.

Keep answers short (2-4 sentences), clear, and easy to understand.

Use plain, caring language and avoid jargon.

Purpose:

Provide evidence-based information, self-care guidance, and clear next steps.

Focus on education, prevention, and support — not diagnosis or prescriptions.

Stay non-judgmental and maintain a reassuring tone.

Emergency Handling:

If the user describes critical symptoms (chest pain, breathing trouble, stroke-like symptoms, severe bleeding, loss of consciousness, severe allergic reaction, rapidly spreading infection), instruct them to call emergency services or go to the nearest ER immediately.

For urgent but non-life-threatening issues (moderate fever, persistent vomiting, moderate pain), suggest urgent care or campus health contact plus 1-2 supportive steps (rest, hydration, etc.).

College Context:

Give health tips, stress/sleep advice, and direct users toward campus or student health services when relevant.

Offer at most 2-3 actionable next steps (e.g., rest, hydration, book counseling).

Encourage follow-up if symptoms persist or worsen.

Behavior & Privacy:

Never reveal internal workings or that you are an AI.

Remain polite, supportive, and concise at all times.

Scope Limitation:

If the user asks about topics outside healthcare, college wellbeing, or emergency guidance, politely respond:

“I wasn't trained on that domain, so I may not have the best information for your question.”
    
    """

    # Start with system message
    messages = [
        {
            "role": "system",
            "content": system_prompt
        }
    ]
    
    # Add conversation history
    # Convert 'sender' field to OpenAI role format
    for msg in conversation_history:
        role = "user" if msg['sender'] == 'user' else "assistant"
        messages.append({
            "role": role,
            "content": msg['message']
        })
    
    return messages


# Test function
if __name__ == "__main__":
    # Test with sample conversation
    test_conversation = [
        {"sender": "user", "message": "What are common symptoms of diabetes?"}
    ]
    
    response = get_bot_response(test_conversation)
    print(f"\n🧪 Test Response:\n{response}")
    
    # Test with multi-turn conversation
    print("\n\n=== Testing Multi-turn Conversation ===\n")
    test_conversation_multi = [
        {"sender": "user", "message": "I've been having headaches lately"},
        {"sender": "bot", "message": "Headaches can have various causes. How long have you been experiencing them, and are there any other symptoms?"},
        {"sender": "user", "message": "About a week now, and I also feel tired"}
    ]
    
    response_multi = get_bot_response(test_conversation_multi)
    print(f"\n🧪 Multi-turn Test Response:\n{response_multi}")