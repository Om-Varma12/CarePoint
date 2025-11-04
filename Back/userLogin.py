import mysql.connector
import bcrypt

# Database configuration
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "medwise"
}

def get_db_connection():
    """Create and return a database connection"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        return None

def verify_password(password, hashed_password):
    """Verify password against hashed password"""
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password)

def hash_password(password):
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def login_user(email, password):
    """
    Authenticate user and return their name and user_id
    
    Args:
        email (str): User's email
        password (str): User's password
        
    Returns:
        dict: {"success": True, "name": "John Doe", "user_id": 123} or {"success": False, "error": "error message"}
    """
    conn = get_db_connection()
    if not conn:
        return {
            "success": False,
            "error": "Database connection failed"
        }
    
    try:
        cursor = conn.cursor()
        
        # Query the database for user - NOW INCLUDING id
        cursor.execute(
            'SELECT id, name, password FROM users WHERE email = %s',
            (email,)
        )
        
        result = cursor.fetchone()
        
        if result:
            user_id, name, stored_password = result
            
            # Verify password
            if verify_password(password, stored_password):
                return {
                    "success": True,
                    "name": name,
                    "user_id": user_id  # NOW RETURNING user_id
                }
            else:
                return {
                    "success": False,
                    "error": "Invalid email or password"
                }
        else:
            return {
                "success": False,
                "error": "Invalid email or password"
            }
            
    except mysql.connector.Error as err:
        print(f"Database error in login_user: {err}")
        return {
            "success": False,
            "error": "Database error occurred"
        }
    finally:
        cursor.close()
        conn.close()

def signup_user(name, email, password):
    """
    Create a new user account
    
    Args:
        name (str): User's name
        email (str): User's email
        password (str): User's password
        
    Returns:
        dict: {"success": True, "name": "John Doe", "user_id": 123} or {"success": False, "error": "error message"}
    """
    conn = get_db_connection()
    if not conn:
        return {
            "success": False,
            "error": "Database connection failed"
        }
    
    try:
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute('SELECT id FROM users WHERE email = %s', (email,))
        if cursor.fetchone():
            return {
                "success": False,
                "error": "User with this email already exists"
            }
        
        # Hash the password
        hashed_password = hash_password(password)
        
        # Insert new user
        insert_query = "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)"
        cursor.execute(insert_query, (name, email, hashed_password))
        
        conn.commit()
        
        # Get the newly created user's ID
        user_id = cursor.lastrowid
        
        print(f"✅ User {name} registered successfully with ID: {user_id}")
        
        return {
            "success": True,
            "name": name,
            "user_id": user_id  # NOW RETURNING user_id
        }
        
    except mysql.connector.IntegrityError:
        return {
            "success": False,
            "error": "User with this email already exists"
        }
    except mysql.connector.Error as err:
        print(f"Database error in signup_user: {err}")
        return {
            "success": False,
            "error": "Database error occurred"
        }
    finally:
        cursor.close()
        conn.close()