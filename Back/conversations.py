import mysql.connector
from datetime import datetime
from typing import Dict, List, Optional

# Database configuration - UPDATE THESE WITH YOUR ACTUAL DATABASE CREDENTIALS
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',  # Change this
    'password': '',  # Change this
    'database': 'medwise'  # Change this
}

def get_db_connection():
    """Create and return a database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        return None


def create_conversation(conversation_hash: str, user_id: int, title: str) -> Dict:
    """
    Create a new conversation in the database
    
    Args:
        conversation_hash: Unique hash identifier for the conversation
        user_id: ID of the user creating the conversation
        title: Title of the conversation (first user message)
    
    Returns:
        Dict with success status and message
    """
    connection = get_db_connection()
    if not connection:
        return {"success": False, "error": "Database connection failed"}
    
    try:
        cursor = connection.cursor()
        
        # Check if conversation already exists
        cursor.execute(
            "SELECT conversation_id FROM conversation WHERE conversation_id = %s",
            (conversation_hash,)
        )
        
        if cursor.fetchone():
            cursor.close()
            connection.close()
            return {"success": False, "error": "Conversation already exists"}
        
        # Insert new conversation with current timestamp
        query = """
            INSERT INTO conversation (conversation_id, user_id, title, started_at, ended_at)
            VALUES (%s, %s, %s, %s, %s)
        """
        current_time = datetime.utcnow()
        cursor.execute(query, (conversation_hash, user_id, title, current_time, current_time))
        connection.commit()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "conversation_id": conversation_hash,
            "message": "Conversation created successfully"
        }
        
    except mysql.connector.Error as err:
        print(f"Error creating conversation: {err}")
        if connection:
            connection.close()
        return {"success": False, "error": str(err)}


def add_message(conversation_hash: str, sender: str, message: str) -> Dict:
    """
    Add a message to an existing conversation
    ALSO updates the conversation's ended_at timestamp to reflect last activity
    
    Args:
        conversation_hash: Hash identifier of the conversation
        sender: Either 'user' or 'bot'
        message: The message content
    
    Returns:
        Dict with success status and message
    """
    connection = get_db_connection()
    if not connection:
        return {"success": False, "error": "Database connection failed"}
    
    try:
        cursor = connection.cursor()
        
        # Verify conversation exists
        cursor.execute(
            "SELECT conversation_id FROM conversation WHERE conversation_id = %s",
            (conversation_hash,)
        )
        
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            return {"success": False, "error": "Conversation not found"}
        
        # Validate sender
        if sender not in ['user', 'bot']:
            cursor.close()
            connection.close()
            return {"success": False, "error": "Invalid sender. Must be 'user' or 'bot'"}
        
        current_time = datetime.utcnow()
        
        # Insert message with current timestamp
        query = """
            INSERT INTO messages (conversation_id, sender, message, timestamp)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (conversation_hash, sender, message, current_time))
        
        # Update ended_at only if sender is 'user'
        if sender == 'user':
            update_query = """
                UPDATE conversation
                SET ended_at = %s
                WHERE conversation_id = %s
            """
            cursor.execute(update_query, (current_time, conversation_hash))
        
        connection.commit()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Message added successfully"
        }
        
    except mysql.connector.Error as err:
        print(f"Error adding message: {err}")
        if connection:
            connection.close()
        return {"success": False, "error": str(err)}


def get_conversation_messages(conversation_hash: str, user_id: Optional[int] = None) -> Dict:
    """
    Get all messages for a specific conversation
    Optional user_id for access validation
    
    Args:
        conversation_hash: Hash identifier of the conversation
        user_id: Optional user ID for validation
    
    Returns:
        Dict with success status and list of messages
    """
    connection = get_db_connection()
    if not connection:
        return {"success": False, "error": "Database connection failed"}
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        query = """
            SELECT message_id, sender, message, timestamp
            FROM messages
            WHERE conversation_id = %s
            ORDER BY timestamp ASC
        """
        cursor.execute(query, (conversation_hash,))
        messages = cursor.fetchall()
        
        # Optional user_id validation
        if user_id is not None:
            cursor.execute(
                "SELECT user_id FROM conversation WHERE conversation_id = %s",
                (conversation_hash,)
            )
            conv_user = cursor.fetchone()
            if not conv_user or conv_user['user_id'] != user_id:
                cursor.close()
                connection.close()
                return {"success": False, "error": "Unauthorized access"}
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "messages": messages
        }
        
    except mysql.connector.Error as err:
        print(f"Error retrieving messages: {err}")
        if connection:
            connection.close()
        return {"success": False, "error": str(err)}


def get_user_conversations(user_id: int) -> Dict:
    """
    Get all conversations for a specific user
    Now returns ended_at which reflects the last message timestamp
    
    Args:
        user_id: ID of the user
    
    Returns:
        Dict with success status and list of conversations
    """
    connection = get_db_connection()
    if not connection:
        return {"success": False, "error": "Database connection failed"}
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        query = """
            SELECT conversation_id, title, started_at, ended_at
            FROM conversation
            WHERE user_id = %s
            ORDER BY ended_at DESC
        """
        cursor.execute(query, (user_id,))
        conversations = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "conversations": conversations,
            "count": len(conversations)
        }
        
    except mysql.connector.Error as err:
        print(f"Error retrieving conversations: {err}")
        if connection:
            connection.close()
        return {"success": False, "error": str(err)}


def update_conversation_title(conversation_hash: str, new_title: str) -> Dict:
    """
    Update the title of a conversation
    
    Args:
        conversation_hash: Hash identifier of the conversation
        new_title: New title for the conversation
    
    Returns:
        Dict with success status
    """
    connection = get_db_connection()
    if not connection:
        return {"success": False, "error": "Database connection failed"}
    
    try:
        cursor = connection.cursor()
        
        query = "UPDATE conversation SET title = %s WHERE conversation_id = %s"
        cursor.execute(query, (new_title, conversation_hash))
        connection.commit()
        
        if cursor.rowcount == 0:
            cursor.close()
            connection.close()
            return {"success": False, "error": "Conversation not found"}
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Title updated successfully"
        }
        
    except mysql.connector.Error as err:
        print(f"Error updating title: {err}")
        if connection:
            connection.close()
        return {"success": False, "error": str(err)}


def end_conversation(conversation_hash: str) -> Dict:
    """
    Mark a conversation as ended (soft delete)
    Note: ended_at is already being updated with each message,
    so this is mainly for marking conversations as "closed" if needed
    
    Args:
        conversation_hash: Hash identifier of the conversation
    
    Returns:
        Dict with success status
    """
    connection = get_db_connection()
    if not connection:
        return {"success": False, "error": "Database connection failed"}
    
    try:
        cursor = connection.cursor()
        
        query = "UPDATE conversation SET ended_at = %s WHERE conversation_id = %s"
        current_time = datetime.utcnow()
        cursor.execute(query, (current_time, conversation_hash))
        connection.commit()
        
        cursor.close()
        connection.close()
        
        return {
            "success": True,
            "message": "Conversation ended successfully"
        }
        
    except mysql.connector.Error as err:
        print(f"Error ending conversation: {err}")
        if connection:
            connection.close()
        return {"success": False, "error": str(err)}