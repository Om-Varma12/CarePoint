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

# Configure CORS properly
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# ==================== USER AUTHENTICATION ENDPOINTS ====================

@app.route('/loginUser', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
        
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


@app.route('/signupUser', methods=['POST', 'OPTIONS'])
def signup():
    if request.method == 'OPTIONS':
        return '', 200
        
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

@app.route('/createConversation', methods=['POST', 'OPTIONS'])
def create_new_conversation():
    if request.method == 'OPTIONS':
        return '', 200
        
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


@app.route('/addMessage', methods=['POST', 'OPTIONS'])
def add_new_message():
    if request.method == 'OPTIONS':
        return '', 200
        
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


@app.route('/getAIResponse', methods=['POST', 'OPTIONS'])
def get_ai_response():
    if request.method == 'OPTIONS':
        return '', 200
        
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
            ai_result = get_bot_response(conversation_history)
            ai_response = ai_result['response']
            medicines = ai_result['medicines']
            
            print(f"✅ AI Response generated: {ai_response[:100]}...")
            print(f"💊 Medicines found: {len(medicines)}")
            
            # Save bot response to database
            save_result = add_message(conversation_hash, 'bot', ai_response)
            
            if not save_result['success']:
                print(f"⚠️ Warning: Failed to save bot message to DB")
            
            # Save medicine recommendations as separate bot messages
            for medicine in medicines:
                med_save_result = add_message(conversation_hash, 'bot', medicine)
                if not med_save_result['success']:
                    print(f"⚠️ Warning: Failed to save medicine recommendation to DB")
            
            return jsonify({
                "success": True,
                "response": ai_response,
                "medicines": medicines
            }), 200
            
        except Exception as ai_error:
            print(f"❌ AI Error: {str(ai_error)}")
            return jsonify({
                "error": f"AI generation failed: {str(ai_error)}"
            }), 500
            
    except Exception as e:
        print(f"Get AI response error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/getConversation/<conversation_hash>', methods=['GET', 'OPTIONS'])
def get_conversation(conversation_hash):
    if request.method == 'OPTIONS':
        return '', 200
        
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


@app.route('/getUserConversations/<int:user_id>', methods=['GET', 'OPTIONS'])
def get_user_convos(user_id):
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        result = get_user_conversations(user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        print(f"Get user conversations error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/updateConversationTitle', methods=['PUT', 'OPTIONS'])
def update_title():
    if request.method == 'OPTIONS':
        return '', 200
        
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


@app.route('/endConversation', methods=['PUT', 'OPTIONS'])
def end_convo():
    if request.method == 'OPTIONS':
        return '', 200
        
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
    print("\n" + "="*60)
    print("🏥 CarePoint Backend Server Starting...")
    print("="*60 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=True)