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
# MERCHANT_CATEGORY_MAP = {
#     # High Confidence (Direct Keywords)
#     "swiggy": {"category": "Food", "type": "direct"},
#     "zomato": {"category": "Food", "type": "direct"},
#     "blinkit": {"category": "Groceries", "type": "direct"},
#     "zepto": {"category": "Groceries", "type": "direct"},
#     "amazon": {"category": "Shopping", "type": "direct"},
#     "flipkart": {"category": "Shopping", "type": "direct"},
#     "myntra": {"category": "Shopping", "type": "direct"},
#     "purple": {"category": "Shopping", "type": "direct"},
#     "uber": {"category": "Transport", "type": "direct"},
#     "netflix": {"category": "Bills & Subscriptions", "type": "direct"},
#     "spotify": {"category": "Bills & Subscriptions", "type": "direct"},
#     "airtel": {"category": "Bills & Subscriptions", "type": "direct"},
    
#     # Medium Confidence (Regex Patterns)
#     # UPI transaction formats for food services
#     r"\b(?:swiggy|zomato)\b": {"category": "Food", "type": "regex"},
#     # UPI transaction formats for grocery services
#     r"\b(?:blinkit|zepto|instamart)\b": {"category": "Groceries", "type": "regex"},
#     # UPI transaction formats for transport services
#     r"\b(?:uber|ola|rapido)\b": {"category": "Transport", "type": "regex"},
#     # UPI transaction formats for shopping services
#     r"\b(?:flipkart|amazon|myntra)\b": {"category": "Shopping", "type": "regex"},
# }

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

# --- Helper function to categorize a single transaction ---
def categorize_transaction(description):
    lower_description = description.lower()
    
    # PRIORITY 1: High Confidence (Check for known merchant keywords)
    for pattern, category in MERCHANT_CATEGORY_MAP.items():
        if re.search(pattern, lower_description):
            return category, "High"
            
    # PRIORITY 2: Medium Confidence (We can add rules for transaction types later if needed)
    # For now, this section will be empty.
            
    # PRIORITY 3: Low Confidence (If nothing matches)
    return "Miscellaneous", "Low"

# --- Helper function to find the most likely description column ---
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
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        df.columns = [col.strip() for col in df.columns]

        if 'Amount' in df.columns:
            df['Amount'] = pd.to_numeric(df['Amount'], errors='coerce').fillna(0)

        # 2. Handle CR/DR format
        if 'Transaction Type' in df.columns:
            df.loc[df['Transaction Type'] == 'DR', 'Amount'] *= -1

        # 3. Convert 'Date' column to datetime objects, then to a standard ISO string
        if 'Date' in df.columns:
            # First, convert to datetime
            df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
            # Now, convert to a standardized string format that MongoDB can always handle
            # This also handles any potential NaT (Not a Time) values safely
            df['Date'] = df['Date'].dt.strftime('%Y-%m-%dT%H:%M:%S').fillna('')
        
        description_col = find_description_column(df.columns)
        if not description_col:
            return {"error": "Could not find a suitable description column in the CSV."}
        
        df.fillna({'Amount': 0}, inplace=True)
        df.fillna('', inplace=True)
            
        records = df.to_dict('records')
        
        for record in records:
            record['account_id'] = account_id
            record['user_id'] = "placeholder_user"
            description = str(record.get(description_col, ''))
            category, confidence = categorize_transaction(description)
            record['category'] = category
            record['confidence'] = confidence

        # --- ADD SPECIFIC ERROR LOGGING FOR DATABASE INSERTION ---
        if records:
            collection.insert_many(records)
            return {"message": f"Successfully uploaded and saved {len(records)} transactions."}
        else:
            return {"error": "No records to save."}

    except Exception as e:
        # This will catch any other errors during parsing
        print(f"FILE PROCESSING FAILED: {e}")
        return {"error": "Failed to process the CSV file."}

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
        # Stage 2: Normalize the merchant name for better grouping
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
        # Stage 3: Sort by merchant and date to prepare for grouping
        {
            '$sort': {'normalized_merchant': 1, 'Date': 1}
        },
        # Stage 4: Group transactions by the normalized merchant
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
        # Stage 5: Filter for merchants with 2 or more transactions
        {
            '$match': {'count': {'$gte': 2}}
        },

        # Stage 6: Calculate the standard deviation of the amounts. A low value means the amounts are very similar.
        {
            '$addFields': {
                'amount_std_dev': {'$stdDevPop': '$transactions.amount'}
            }
        },

        # Stage 7: Calculate the time difference in days between consecutive transactions
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
        # Stage 8: Filter for recurring patterns (e.g., transactions every 28-31 days)
        {
            '$match': {
                'time_diffs_days': {'$elemMatch': {'$gte': 28, '$lte': 31}},
                'amount_std_dev': {'$lte': 5.0} # Allow for a very small variance in amount (e.g., a few rupees/cents)
            }
        },
        # Stage 9: Project to a clean output format
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