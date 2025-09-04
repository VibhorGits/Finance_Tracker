from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pymongo import MongoClient
from bson import ObjectId
import json
import io

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

# Add this new endpoint to fetch all transactions
@app.get("/transactions/")
def get_transactions():
    transactions = []
    # Find all documents in the collection
    for doc in collection.find({}):
        # Convert the ObjectId to a string so it can be sent as JSON
        doc['_id'] = str(doc['_id'])
        transactions.append(doc)
    return transactions

@app.post("/uploadfile/")
async def create_upload_file(file: UploadFile = File(...)):
    contents = await file.read()

    #    We use io.StringIO to treat the byte string as a file
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))

    # Convert the Pandas DataFrame into a list of dictionaries
    records = df.to_dict('records')

    # Insert the records into the MongoDB collection
    collection.insert_many(records)

    return {"message": f"Successfully uploaded and saved {len(records)} transactions."}
    # return {"filename": file.filename, "content_type": file.content_type}