from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pymongo import MongoClient
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional
import google.generativeai as genai
import os
import json
import io, re 
from dotenv import load_dotenv

# Load the environment variables from the .env file
load_dotenv()

MERCHANT_CATEGORY_MAP = {
    # High Confidence (Finds these keywords as whole words anywhere in the description)
    r"\b(?:swiggy|zomato|eatsure)\b": "Food",
    r"\b(?:blinkit|zepto|instamart)\b": "Groceries",
    r"\b(?:uber|ola|rapido)\b": "Transport",
    r"\b(?:flipkart|amazon|myntra|purple)\b": "Shopping",
    r"\b(?:netflix|spotify|airtel)\b": "Bills & Subscriptions",
    r"\b(?:irctc)\b": "Travel",
}

class Account(BaseModel):
    account_name: str
    account_type: str

class TransactionUpdate(BaseModel):
    category: str

class AIQuery(BaseModel):
    query: str

print("DEBUG: GOOGLE_API_KEY loaded:", os.getenv("GOOGLE_API_KEY") is not None)
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel('models/gemini-2.5-flash')

# --- Helper function to extract merchant name from UPI description ---
def extract_merchant_from_upi(description):
    # If it's a UPI transaction, try to extract the merchant name
    if description.startswith('UPI/'):
        parts = description.split('/')
        if len(parts) > 3:
            # Usually the merchant is in the last part or before @
            merchant_part = parts[-1]
            # Remove trailing commas or other artifacts
            merchant_part = merchant_part.strip(',').strip()
            # If it contains @, take the part before @
            if '@' in merchant_part:
                merchant_part = merchant_part.split('@')[0]
            return merchant_part
    return description

# --- Helper function to categorize a single transaction ---
def categorize_transaction(description):
    # First, try to extract a cleaner merchant name if it's UPI
    clean_description = extract_merchant_from_upi(description)
    lower_description = clean_description.lower()

    # PRIORITY 1: High Confidence (Check for known merchant keywords)
    for pattern, category in MERCHANT_CATEGORY_MAP.items():
        if re.search(pattern, lower_description):
            return category, "High"

    # PRIORITY 2: Medium Confidence (We can add rules for transaction types later if needed)
    # For now, this section will be empty.

    # PRIORITY 3: Low Confidence (If nothing matches)
    return "Miscellaneous", "Low"

# --- Helper function to parse date strings robustly ---
def parse_date(date_str):
    if pd.isna(date_str) or str(date_str).strip() == '':
        return ''
    date_str = str(date_str).strip().rstrip(',')
    try:
        dt = pd.to_datetime(date_str, dayfirst=True, errors='raise')
        return dt.strftime('%Y-%m-%dT%H:%M:%S')
    except:
        try:
            dt = pd.to_datetime(date_str, dayfirst=False, errors='raise')
            return dt.strftime('%Y-%m-%dT%H:%M:%S')
        except:
            return ''

# --- Helper function to detect and map columns to standard names ---
def detect_and_map_columns(df):
    columns = df.columns.tolist()
    mapping = {}

    # Possible column names for each standard field (case insensitive)
    date_candidates = ['date', 'transaction date', 'txn date']
    amount_candidates = ['amount', 'txn amount', 'value']
    description_candidates = ['description', 'narration', 'transaction details', 'particulars', 'notes', 'upi_reference']
    transaction_type_candidates = ['transaction type', 'type', 'cr/dr', 'dr/cr']

    for col in columns:
        col_lower = col.lower().strip()
        if any(candidate in col_lower for candidate in date_candidates) or 'date' in col_lower:
            mapping['Date'] = col
        elif any(candidate in col_lower for candidate in amount_candidates) or 'amount' in col_lower:
            mapping['Amount'] = col
        elif col_lower in description_candidates:
            if 'Description' not in mapping:  # Take the first match
                mapping['Description'] = col
        elif any(candidate in col_lower for candidate in transaction_type_candidates) or 'type' in col_lower:
            mapping['Transaction_Type'] = col

    # Special handling: if no Description but UPI_Reference exists, use it
    if 'Description' not in mapping:
        for col in columns:
            if 'upi' in col.lower() or 'reference' in col.lower():
                mapping['Description'] = col
                break

    return mapping

# --- Helper function to find the most likely description column (kept for compatibility) ---
def find_description_column(columns):
    # A list of possible names for the description column, in order of preference
    potential_columns = [
        "transaction details", "description", "narration", "particulars", "notes", "upi_reference"
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

# --- Database Connection ---
connection_string = os.getenv("MONGO_CONNECTION_STRING")
print("DEBUG: Attempting to connect to MongoDB...")
print("DEBUG: MONGO_CONNECTION_STRING loaded:", connection_string is not None)
if connection_string:
    print("DEBUG: MONGO_CONNECTION_STRING value:", connection_string[:50] + "..." if len(connection_string) > 50 else connection_string)
else:
    print("ERROR: MONGO_CONNECTION_STRING is None - database connection will fail!")

try:
    client = MongoClient(connection_string)
    # Test the connection
    client.admin.command('ping')
    print("DEBUG: MongoDB connection successful!")
except Exception as e:
    print(f"ERROR: MongoDB connection failed: {e}")
    print("This will cause all database operations to fail!")
# Select your database (it will be created if it doesn't exist)
db = client['finance_tracker_db']
# Select your collection (like a table in SQL)
collection = db['transactions']

# Create an instance of the FastAPI class
app = FastAPI()

# Define the origins that are allowed to make requests
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://your-app.vercel.app",  # Replace with your actual Vercel domain
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
@app.patch("/accounts/{account_id}")
def update_account(account_id: str, account: Account):
    # Convert the pydantic model to a dictionary
    account_data = account.dict()
    # Update the account in the 'accounts' collection
    result = db.accounts.update_one(
        {'_id': ObjectId(account_id)},
        {'$set': account_data}
    )

    # Check if a document was successfully updated
    if result.modified_count == 1:
        return {"status": "success", "message": "Account updated successfully."}
    else:
        # If no document was found with that ID, return an error
        return {"status": "error", "message": "Account not found."}

@app.delete("/accounts/{account_id}")
def delete_account(account_id: str):
    # Delete the account from the 'accounts' collection
    account_result = db.accounts.delete_one({'_id': ObjectId(account_id)})
    # Delete associated transactions from the 'transactions' collection
    transaction_result = collection.delete_many({'account_id': account_id})

    # Check if the account was successfully deleted
    if account_result.deleted_count == 1:
        return {"status": "success", "message": f"Account and {transaction_result.deleted_count} associated transactions deleted successfully."}
    else:
        # If no document was found with that ID, return an error
        return {"status": "error", "message": "Account not found."}


# --- Analytics Endpoint ---
@app.get("/analytics/summary/{account_id}")
def get_analytics_summary(account_id: str):
    # Define the MongoDB Aggregation Pipeline
    pipeline = [
        {
            # Stage 1: Match documents for the specified account and user
            '$match': {
                'account_id': account_id,
                'user_id': 'placeholder_user'
            }
        },
        {
            # Stage 2: Group the documents to calculate summaries
            '$group': {
                '_id': None,  # Group all matched documents together
                'total_spending': {
                    # Sum amounts that are negative (expenses)
                    '$sum': {
                        '$cond': [{'$lt': ['$Amount', 0]}, '$Amount', 0]
                    }
                },
                'total_income': {
                    # Sum amounts that are positive (income)
                    '$sum': {
                        '$cond': [{'$gt': ['$Amount', 0]}, '$Amount', 0]
                    }
                },
                'transaction_count': {'$sum': 1} # Count the total number of documents
            }
        },
        {
            # Stage 3: Project to reshape the output
            '$project': {
                '_id': 0, # Exclude the default _id field
                'total_spending': {'$multiply': ['$total_spending', -1]}, # Make spending a positive number
                'total_income': '$total_income',
                'net_cash_flow': {'$add': ['$total_income', '$total_spending']},
                'transaction_count': '$transaction_count'
            }
        }
    ]

    # Execute the aggregation pipeline
    result = list(collection.aggregate(pipeline))

    # If there are any results, return the first element, otherwise return an empty object
    if result:
        return result[0]
    else:
        # Return default values if no transactions are found for that account
        return {
            "total_spending": 0,
            "total_income": 0,
            "net_cash_flow": 0,
            "transaction_count": 0
        }
    
# ENDPOINT : For the Pie Chart
@app.get("/analytics/spending_by_category/{account_id}")
def get_spending_by_category(account_id: str):
    pipeline = [
        {
            # Stage 1: Match only expenses for the specified account
            '$match': {
                'account_id': account_id,
                'user_id': 'placeholder_user',
                'Amount': {'$lt': 0} # Filter for expenses only
            }
        },
        {
            # Stage 2: Group by category and sum the amounts
            '$group': {
                '_id': '$category', # Group documents by the 'category' field
                'total_amount': {'$sum': '$Amount'}
            }
        },
        {
            # Stage 3: Project to reshape the output
            '$project': {
                '_id': 0, # Exclude the default _id field
                'category': '$_id', # Rename _id to category
                'total': {'$multiply': ['$total_amount', -1]} # Make the total a positive number
            }
        }
    ]
    result = list(collection.aggregate(pipeline))
    return result

# --- "Needs Review" Endpoint ---
@app.get("/transactions/review/")
def get_transactions_for_review(account_id: Optional[str] = None):
    query = {
        # Use the $in operator to find documents where confidence is either "Medium" or "Low"
        'confidence': {'$in': ["Medium", "Low"]},
        'user_id': 'placeholder_user'
    }
    
    # If an account_id is provided, add it to the filter
    if account_id:
        query['account_id'] = account_id
    
    transactions = []
    for doc in collection.find(query):
        doc['_id'] = str(doc['_id'])
        transactions.append(doc)
    
    return transactions

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
        for key, value in doc.items():
            # A simple check for NaN, which is common from pandas
            if isinstance(value, float) and value != value: # Check for NaN
                doc[key] = None # Convert NaN to None (which becomes null in JSON)
                
        # Convert the ObjectId to a string so it can be sent as JSON
        doc['_id'] = str(doc['_id'])
        transactions.append(doc)
    return transactions

@app.patch("/transactions/{transaction_id}")
def update_transaction_category(transaction_id: str, update_data: TransactionUpdate):
    # Use MongoDB's update_one method to find the document and update it
    result = collection.update_one(
        {'_id': ObjectId(transaction_id)}, # Filter to find the document by its ID
        {
            '$set': { # Use the $set operator to update specific fields
                'category': update_data.category,
                'confidence': 'High' # Set confidence to High since it's user-verified
            }
        }
    )

    # Check if a document was successfully updated
    if result.modified_count == 1:
        return {"status": "success", "message": "Transaction updated successfully."}
    else:
        # If no document was found with that ID, return an error
        return {"status": "error", "message": "Transaction not found."}

@app.post("/uploadfile/")
async def create_upload_file(file: UploadFile = File(...), account_id: str = Form(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8-sig')))
        print("Raw df head:\n", df.head().to_string())
        df.columns = [col.strip() for col in df.columns]
        print("Columns after strip:", df.columns.tolist())

        # Check for column misalignment: if Date column has 'CR'/'DR', shift columns
        if 'Date' in df.columns and df['Date'].str.upper().isin(['CR', 'DR']).any():
            df.rename(columns={'Date': 'Transaction Type', 'Transaction Type': 'Amount', 'Amount': 'UPI_Reference', 'UPI_Reference': 'Date'}, inplace=True)
            print("Columns shifted to fix misalignment")
            print("Columns after shift:", df.columns.tolist())
            print("Date values after shift:", df['Date'].tolist()[:5])

        # Detect column mapping
        column_mapping = detect_and_map_columns(df)
        print("Detected column mapping:", column_mapping)

        # Validate required columns
        required_columns = ['Date', 'Amount', 'Description']
        missing_columns = [col for col in required_columns if col not in column_mapping]
        if missing_columns:
            return {"error": f"Required columns not found: {missing_columns}. Available columns: {df.columns.tolist()}"}

        # Assign mapped columns
        date_col = column_mapping['Date']
        amount_col = column_mapping['Amount']
        description_col = column_mapping['Description']
        transaction_type_col = column_mapping.get('Transaction_Type')

        # Convert Amount to numeric
        df[amount_col] = pd.to_numeric(df[amount_col], errors='coerce').fillna(0)

        # Handle CR/DR format if Transaction_Type column exists
        if transaction_type_col and transaction_type_col in df.columns:
            df.loc[df[transaction_type_col] == 'DR', amount_col] *= -1
            print("Applied DR negation based on Transaction_Type")

        # Convert Date column to datetime and standardize
        if date_col in df.columns:
            print("Date values before processing:", df[date_col].tolist()[:5])
            df[date_col] = df[date_col].apply(parse_date)
            print("Sample dates after processing:", df[date_col].tolist()[:5])

        # Fill NaNs
        df.fillna({amount_col: 0}, inplace=True)
        df.fillna('', inplace=True)

        # Process records
        records = []
        for record in df.to_dict('records'):
            record['account_id'] = account_id
            record['user_id'] = "placeholder_user"
            description = str(record.get(description_col, ''))
            record['Description'] = description
            category, confidence = categorize_transaction(description)
            record['category'] = category
            record['confidence'] = confidence
            records.append(record)

        # Insert into database
        if records:
            print("Sample processed record:", records[0])
            collection.insert_many(records)
            return {"message": f"Successfully uploaded and saved {len(records)} transactions."}
        else:
            return {"error": "No records to save."}

    except Exception as e:
        print(f"FILE PROCESSING FAILED: {e}")
        import traceback
        traceback.print_exc()
        return {"error": f"Failed to process the CSV file: {str(e)}"}

@app.get("/analytics/subscriptions/{account_id}")
def get_subscriptions(account_id: str):
    # First, fetch all transactions for the account to find the description column
    account_transactions = list(collection.find({'account_id': account_id, 'user_id': 'placeholder_user'}))
    if not account_transactions:
        return []
    
    # Create a temporary DataFrame to easily find the column name
    df_temp = pd.DataFrame(account_transactions)
    description_col = find_description_column(df_temp.columns)

    if not description_col:
        return []
    
    pipeline = [
        # Stage 1: Match expenses for the specified account
        {
            '$match': {
                'account_id': account_id,
                'user_id': 'placeholder_user',
                'Amount': {'$lt': 0}
            }
        },
        # Stage 2: Filter out transactions with invalid dates
        {
            '$match': {
                'Date': {'$ne': ''}
            }
        },
        # Stage 3: Normalize the merchant name for better grouping
        {
            '$addFields': {
                'normalized_merchant': {
                    '$arrayElemAt': [
                        {'$split': [
                            {'$replaceAll': {'input': {'$toLower': f'${description_col}'}, 'find': '/', 'replacement': ' '}},
                            ' '
                        ]},
                        0 # Use the first part of the description as a potential merchant
                    ]
                }
            }
        },
        # Stage 4: Sort by merchant and date to prepare for grouping
        {
            '$sort': {'normalized_merchant': 1, 'Date': 1}
        },
        # Stage 5: Group transactions by the normalized merchant
        {
            '$group': {
                '_id': '$normalized_merchant',
                'transactions': {
                    '$push': {
                        'date': {'$toDate': '$Date'}, # Convert date string to date object
                        'amount': '$Amount'
                    }
                },
                'count': {'$sum': 1}
            }
        },
        # Stage 6: Filter for merchants with 2 or more transactions
        {
            '$match': {'count': {'$gte': 2}}
        },

        # Stage 7: Calculate the standard deviation of the amounts. A low value means the amounts are very similar.
        {
            '$addFields': {
                'amount_std_dev': {'$stdDevPop': '$transactions.amount'}
            }
        },

        # Stage 8: Calculate the time difference in days between consecutive transactions
        {
            '$addFields': {
                'time_diffs_days': {
                    '$map': {
                        'input': {'$range': [0, {'$subtract': ['$count', 1]}]},
                        'as': 'i',
                        'in': {
                            '$divide': [
                                {'$subtract': [
                                    {'$arrayElemAt': ['$transactions.date', {'$add': ['$$i', 1]}]},
                                    {'$arrayElemAt': ['$transactions.date', '$$i']}
                                ]},
                                1000 * 60 * 60 * 24 # Convert milliseconds to days
                            ]
                        }
                    }
                }
            }
        },
        # Stage 9: Filter for recurring patterns (e.g., transactions every 28-31 days)
        {
            '$match': {
                'time_diffs_days': {'$elemMatch': {'$gte': 28, '$lte': 31}},
                'amount_std_dev': {'$lte': 5.0} # Allow for a very small variance in amount (e.g., a few rupees/cents)
            }
        },
        # Stage 10: Project to a clean output format
        {
            '$project': {
                '_id': 0,
                'merchant': '$_id',
                'transaction_count': '$count',
                'avg_amount': {'$avg': '$transactions.amount'},
                'last_payment_date': {'$max': '$transactions.date'}
            }
        }
    ]

    result = list(collection.aggregate(pipeline))
    return result

# --- Natural Language Query Endpoint ---
@app.post("/analytics/query/{account_id}")
def handle_ai_query(account_id: str, query: AIQuery):
    # 1. Fetch relevant transactions to provide context
    # We'll fetch the last 50 transactions for context, you can adjust this number
    transactions = list(collection.find(
        {'account_id': account_id, 'user_id': 'placeholder_user'},
        sort=[('Date', -1)],
        limit=40
    ))

    if not transactions:
        return {"answer": "I couldn't find any transactions for this account to analyze."}

    # 2. Prepare the data for the prompt by converting it to a simple string format
    transaction_context = ""
    for t in transactions:
        # Convert ObjectId to string and handle potential missing keys
        t['_id'] = str(t.get('_id'))
        date_str = t.get('Date', 'N/A')
        desc_str = t.get('Transaction details') or t.get('description') or t.get('UPI_Reference', 'N/A')
        amount_str = f"{t.get('Amount', 0):.2f}"
        cat_str = t.get('category', 'N/A')
        transaction_context += f"- Date: {date_str}, Description: {desc_str}, Amount: {amount_str}, Category: {cat_str}\n"

    # 3. Create a detailed prompt for the LLM
    prompt = f"""
    You are a helpful personal finance assistant. Analyze the following list of transactions and answer the user's question based ONLY on this data. Do not make up information. Provide a concise, helpful answer.

    Here are the user's transactions:
    {transaction_context}

    User's Question: "{query.query}"
    """

    # 4. Send the prompt to the Gemini API
    try:
        response = model.generate_content(prompt)
        return {"answer": response.text}
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return {"answer": "Sorry, I encountered an error while analyzing your question."}
