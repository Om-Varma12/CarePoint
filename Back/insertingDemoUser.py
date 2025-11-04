import mysql.connector
import bcrypt

# --- 1️⃣ Connect to your MySQL database ---
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="medwise"
)
cursor = conn.cursor()

# --- 2️⃣ User details ---
name = "Om Varma"
email = "om@example.com"
password = "pass@123"

# --- 3️⃣ Hash the password using bcrypt ---
hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

# --- 4️⃣ Insert user into the database ---
insert_query = "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)"
cursor.execute(insert_query, (name, email, hashed_password))
conn.commit()

print("✅ User inserted successfully with hashed password!")