from flask import Flask, request, jsonify
from flask_cors import CORS
from userLogin import login_user, signup_user
from conversations import (
    create_conversation,
    add_message,
    get_conversation_messages,
    get_user_conversations,
    update_conversation_title,
    end_conversation
)
from botResponse import get_bot_response

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# ==================== USER AUTHENTICATION ENDPOINTS ====================

@app.route('/loginUser', methods=['POST'])
def login():
    """
    Handle user login requests
    Expects JSON: { "email": "user@example.com", "password": "password123" }
    Returns JSON: { "name": "John Doe", "user_id": 123 } or { "error": "error message" }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        result = login_user(email, password)
        
        if result['success']:
            return jsonify({
                "name": result['name'],
                "user_id": result.get('user_id')
            }), 200
        else:
            return jsonify({"error": result['error']}), 401
            
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/signupUser', methods=['POST'])
def signup():
    """
    Handle user signup requests
    Expects JSON: { "name": "John Doe", "email": "user@example.com", "password": "password123" }
    Returns JSON: { "name": "John Doe", "user_id": 123 } or { "error": "error message" }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        
        if not name or not email or not password:
            return jsonify({"error": "Name, email and password are required"}), 400
        
        result = signup_user(name, email, password)
        
        if result['success']:
            return jsonify({
                "name": result['name'],
                "user_id": result.get('user_id')
            }), 201
        else:
            return jsonify({"error": result['error']}), 400
            
    except Exception as e:
        print(f"Signup error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# ==================== CONVERSATION ENDPOINTS ====================

@app.route('/createConversation', methods=['POST'])
def create_new_conversation():
    """
    Create a new conversation
    Expects JSON: {
        "conversation_hash": "abc123xyz",
        "user_id": 1,
        "title": "First message from user"
    }
    Returns JSON: { "success": true, "conversation_id": "abc123xyz" }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        conversation_hash = data.get('conversation_hash')
        user_id = data.get('user_id')
        title = data.get('title')
        
        if not conversation_hash or not user_id or not title:
            return jsonify({"error": "conversation_hash, user_id, and title are required"}), 400
        
        result = create_conversation(conversation_hash, user_id, title)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Create conversation error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/addMessage', methods=['POST'])
def add_new_message():
    """
    Add a message to a conversation
    Expects JSON: {
        "conversation_hash": "abc123xyz",
        "sender": "user",  // or "bot"
        "message": "Hello, I need help"
    }
    Returns JSON: { "success": true }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        conversation_hash = data.get('conversation_hash')
        sender = data.get('sender')
        message = data.get('message')
        
        if not conversation_hash or not sender or not message:
            return jsonify({"error": "conversation_hash, sender, and message are required"}), 400
        
        result = add_message(conversation_hash, sender, message)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Add message error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/getAIResponse', methods=['POST'])
def get_ai_response():
    """
    Get AI bot response for a conversation
    Expects JSON: {
        "conversation_hash": "abc123xyz"
    }
    Returns JSON: { "success": true, "response": "AI generated response" }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        conversation_hash = data.get('conversation_hash')
        
        if not conversation_hash:
            return jsonify({"error": "conversation_hash is required"}), 400
        
        # Get conversation history from database
        conv_result = get_conversation_messages(conversation_hash)
        
        if not conv_result['success']:
            return jsonify({"error": "Failed to get conversation history"}), 404
        
        # Format messages for AI
        conversation_history = conv_result['messages']
        
        print(f"🤖 Generating AI response for conversation: {conversation_hash}")
        print(f"📚 Conversation history length: {len(conversation_history)} messages")
        
        # Get AI response
        try:
            ai_response = get_bot_response(conversation_history)
            print(f"✅ AI Response generated: {ai_response[:100]}...")
            
            # Save bot response to database
            save_result = add_message(conversation_hash, 'bot', ai_response)
            
            if not save_result['success']:
                print(f"⚠️ Warning: Failed to save bot message to DB")
            
            return jsonify({
                "success": True,
                "response": ai_response
            }), 200
            
        except Exception as ai_error:
            print(f"❌ AI Error: {str(ai_error)}")
            return jsonify({
                "error": f"AI generation failed: {str(ai_error)}"
            }), 500
            
    except Exception as e:
        print(f"Get AI response error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/getConversation/<conversation_hash>', methods=['GET'])
def get_conversation(conversation_hash):
    """
    Get all messages for a specific conversation
    Optional query param: user_id
    Returns JSON: { "success": true, "messages": [...] }
    """
    try:
        user_id = request.args.get('user_id', type=int)
        
        result = get_conversation_messages(conversation_hash, user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        print(f"Get conversation error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/getUserConversations/<int:user_id>', methods=['GET'])
def get_user_convos(user_id):
    """
    Get all conversations for a specific user
    Returns JSON: { "success": true, "conversations": [...] }
    """
    try:
        result = get_user_conversations(user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        print(f"Get user conversations error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/updateConversationTitle', methods=['PUT'])
def update_title():
    """
    Update conversation title
    Expects JSON: {
        "conversation_hash": "abc123xyz",
        "title": "New title"
    }
    Returns JSON: { "success": true }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        conversation_hash = data.get('conversation_hash')
        title = data.get('title')
        
        if not conversation_hash or not title:
            return jsonify({"error": "conversation_hash and title are required"}), 400
        
        result = update_conversation_title(conversation_hash, title)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        print(f"Update title error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/endConversation', methods=['PUT'])
def end_convo():
    """
    Mark a conversation as ended
    Expects JSON: { "conversation_hash": "abc123xyz" }
    Returns JSON: { "success": true }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        conversation_hash = data.get('conversation_hash')
        
        if not conversation_hash:
            return jsonify({"error": "conversation_hash is required"}), 400
        
        result = end_conversation(conversation_hash)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        print(f"End conversation error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# ==================== HEALTH CHECK ====================

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({"status": "healthy"}), 200


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)