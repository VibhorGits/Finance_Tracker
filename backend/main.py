from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pymongo import MongoClient
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional 
import json
import io, re 

# We'll now include a 'type' (direct or regex) for more advanced matching
MERCHANT_CATEGORY_MAP = {
    # High Confidence (Direct Keywords)
    "swiggy": {"category": "Food", "type": "direct"},
    "zomato": {"category": "Food", "type": "direct"},
    "blinkit": {"category": "Groceries", "type": "direct"},
    "zepto": {"category": "Groceries", "type": "direct"},
    "amazon": {"category": "Shopping", "type": "direct"},
    "flipkart": {"category": "Shopping", "type": "direct"},
    "myntra": {"category": "Shopping", "type": "direct"},
    "purple": {"category": "Shopping", "type": "direct"},
    "uber": {"category": "Transport", "type": "direct"},
    "netflix": {"category": "Bills & Subscriptions", "type": "direct"},
    "spotify": {"category": "Bills & Subscriptions", "type": "direct"},
    "airtel": {"category": "Bills & Subscriptions", "type": "direct"},
    
    # Medium Confidence (Regex Patterns)
    # UPI transaction formats for food services
    r"\b(?:swiggy|zomato)\b": {"category": "Groceries", "type": "regex"},
    # UPI transaction formats for grocery services
    r"\b(?:blinkit|zepto|instamart)\b": {"category": "Groceries", "type": "regex"},
    # UPI transaction formats for transport services
    r"\b(?:uber|ola|rapido)\b": {"category": "Transport", "type": "regex"},
    # UPI transaction formats for shopping services
    r"\b(?:flipkart|amazon|myntra)\b": {"category": "Shopping", "type": "regex"},
}

# --- Helper function to categorize a single transaction ---
def categorize_transaction(description):
    lower_description = description.lower()
     # High Confidence: Check for direct keyword matches first
    for keyword, details in MERCHANT_CATEGORY_MAP.items():
        if details['type'] == 'direct':
            if re.search(r'(^|\s)' + re.escape(keyword) + r'($|\s)', lower_description):
                return details['category'], "High"
            
    # Medium Confidence: If no direct match, check regex patterns
    for pattern, details in MERCHANT_CATEGORY_MAP.items():
        if details['type'] == 'regex' and re.search(pattern, lower_description):
            return details['category'], "Medium"
            
    # Low Confidence: If no matches are found
    return "Miscellaneous", "Low"

# --- Helper function to find the most likely description column ---
def find_description_column(columns):
    # A list of possible names for the description column, in order of preference
    potential_columns = [
        "transaction details", "description", "narration", "particulars", "notes"
    ]
    for col in columns:
        # Check if a cleaned-up column name matches one of our potential names
        if col.strip().lower() in potential_columns:
            return col  # Return the original column name
    return None # Return None if no matching column is found

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return json.JSONEncoder.default(self, o)
    
class Account(BaseModel):
    account_name: str
    account_type: str

# --- Database Connection ---
connection_string = "mongodb+srv://Cluster12390:fU9EeUF7THNx@cluster12390.fzv363x.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(connection_string)
# Select your database (it will be created if it doesn't exist)
db = client['finance_tracker_db']
# Select your collection (like a table in SQL)
collection = db['transactions']

# Create an instance of the FastAPI class
app = FastAPI()

# Define the origins that are allowed to make requests
origins = [
    "http://localhost:5173",
]

# Add the middleware to your app
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods
    allow_headers=["*"], # Allow all headers
)

# Define a "path operation decorator" for the root URL
@app.get("/")
def read_root():
    # This function will run when a user visits the main URL
    return {"message": "Hello from the FastAPI Backend!"}

# Add the endpoint to create a new account
@app.post("/accounts/")
def create_account(account: Account):
    # Convert the pydantic model to a dictionary
    account_data = account.dict()
    # For now, we'll add a placeholder user_id
    # We will replace this with a real one when we add authentication
    account_data['user_id'] = "placeholder_user" 
    
    # Insert the new account into the 'accounts' collection
    db.accounts.insert_one(account_data)
    return {"status": "success", "message": "Account created successfully."}

# Add the endpoint to fetch all accounts
@app.get("/accounts/")
def get_accounts():
    accounts = []
    for doc in db.accounts.find({"user_id": "placeholder_user"}): # Find only for our placeholder user
        doc['_id'] = str(doc['_id'])
        accounts.append(doc)
    return accounts

# Add this new endpoint to fetch all transactions
@app.get("/transactions/")
def get_transactions(account_id: Optional[str] = None):
    query = {}
    # If an account_id is provided in the request, add it to our query filter
    if account_id:
        query['account_id'] = account_id
    
    # We can also add the user_id filter to be safe
    query['user_id'] = "placeholder_user"

    transactions = []
    # Find all documents in the collection
    for doc in collection.find(query):
        # Convert the ObjectId to a string so it can be sent as JSON
        doc['_id'] = str(doc['_id'])
        transactions.append(doc)
    return transactions

@app.post("/uploadfile/")
async def create_upload_file(file: UploadFile = File(...), account_id: str = Form(...)):
    contents = await file.read()

    #    We use io.StringIO to treat the byte string as a file
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))

    # Clean column headers
    df.columns = [col.strip() for col in df.columns]

     # Use the Smart Column Finder to identify the description column
    description_col = find_description_column(df.columns)
    if not description_col:
        return {"error": "Could not find a suitable description column in the CSV."}

    # Convert the Pandas DataFrame into a list of dictionaries
    records = df.to_dict('records')

    # Add the account_id and user_id to each transaction record
    for record in records:
        record['account_id'] = account_id
        record['user_id'] = "placeholder_user" 

        description = record.get(description_col, '')
        
        # Call the upgraded function and save both category and confidence
        category, confidence = categorize_transaction(description)
        record['category'] = category
        record['confidence'] = confidence

    # Insert the records into the MongoDB collection
    collection.insert_many(records)

    return {"message": f"Successfully uploaded and saved {len(records)} transactions for account {account_id}."}
    # return {"filename": file.filename, "content_type": file.content_type}