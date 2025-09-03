from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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