# Kutumbsetu Architecture

Below is the ASCII representation of the platform's architecture and data flow, as requested.

```text
================================================================================
               KUTUMBSETU SYSTEM ARCHITECTURE
================================================================================

                           [ User Browser ]
                                  |
                                  v
     +-------------------------------------------------------------+
     |                    React Frontend UI                        |
     |                                                             |
     |  +-------------+    +----------------+    +--------------+  |
     |  | Admin Panel |    | Citizen Portal |    | Officer View |  |
     |  +-------------+    +----------------+    +--------------+  |
     |        |                    |                    |          |
     +--------|--------------------|--------------------|----------+
              |                    |                    |
              \                    |                    /
               \---------------+   |   +---------------/
                               v   v   v
     +-------------------------------------------------------------+
     |                 Node.js / Express Backend                   |
     |                                                             |
     |  +------------+  +--------------+  +---------------------+  |
     |  | Auth Logic |  | Criteria API |  | Document Controller |  |
     |  +------------+  +--------------+  +---------------------+  |
     |         |               |                     |             |
     +---------|---------------|---------------------|-------------+
               |               |                     |
     +---------+               |                     +---------------+
     |                         |                                     |
     v                         v                                     v
+--------------------+  +--------------------------------+  +-------------------+
|  AI / RAG Engine   |  |      Supabase PostgreSQL       |  |   Supabase S3     |
|  (LangChain)       |  |    (Relational + pgvector)     |  |  Object Storage   |
|                    |  |                                |  |                   |
| +----------------+ |  |  - users, families             |  |  - Citizen Vault  |
| | HuggingFace    |-|->|  - scheme_vectors (Chunks)     |  |    (Aadhaar etc.) |
| | (Embeddings)   | |  |  - schemes (JSONB logic)       |  |                   |
| +----------------+ |  |  - benefit_requests            |  |  - Scheme .md     |
|                    |  |                                |  |    Guidelines     |
| +----------------+ |  +--------------------------------+  +-------------------+
| | Groq LLM API   | |
| | (Inference)    | |
| +----------------+ |
+--------------------+
```

## Data Flow Explanation

1. **User Interaction:** The user interacts with the React Frontend (Admin uploading schemes, Citizen uploading documents, or Officer reviewing requests).
2. **Backend Processing:** Requests are routed to the Express Backend. The backend handles authentication, runs the automated Rule Engine to calculate scheme eligibility, and manages API routing.
3. **Database (Supabase PostgreSQL):** The primary source of truth. It stores all structured data (families, schemes, criteria logic) and also utilizes the `pgvector` extension to store vector embeddings for the AI.
4. **File Storage (Supabase S3):** Physical files (Citizen identity documents and Admin markdown files) are buffered through the backend and securely uploaded to the S3 bucket. Clickable hyperlinks are then stored in the PostgreSQL database.
5. **AI RAG (Retrieval-Augmented Generation):** 
   - **Ingestion:** When an Admin uploads a `.md` file, LangChain splits it into chunks, sends it to HuggingFace for vectorization, and stores it in `pgvector`.
   - **Querying:** When a Citizen asks a question, LangChain queries `pgvector` for similar chunks, attaches them as context, and queries the Groq LLM to generate a natural language response.
