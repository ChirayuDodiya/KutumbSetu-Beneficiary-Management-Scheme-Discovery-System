const { ChatGroq } = require("@langchain/groq");
const { HuggingFaceInferenceEmbeddings } = require("@langchain/community/embeddings/hf");
const { PGVectorStore } = require("@langchain/community/vectorstores/pgvector");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const fs = require('fs');
const path = require('path');
const { Document } = require("@langchain/core/documents");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { Pool } = require("pg");

// Re-use the existing DATABASE_URL for pgvector
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Initialize Embeddings
const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACEHUB_API_KEY,
  model: "sentence-transformers/all-MiniLM-L6-v2", 
});

// Initialize Groq LLM
const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-120b", 
  temperature: 0
});

// Ingest markdown documents into Supabase pgvector
const ingestDocuments = async () => {
  console.log("Starting ingestion to Supabase pgvector...");
  const docsDir = path.join(__dirname, '../data/scheme_docs');
  const files = fs.readdirSync(docsDir);
  
  let rawDocs = [];
  for (const file of files) {
    if (file.endsWith('.md')) {
      const content = fs.readFileSync(path.join(docsDir, file), 'utf8');
      rawDocs.push(new Document({ pageContent: content, metadata: { source: file } }));
    }
  }

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  
  const docs = await textSplitter.splitDocuments(rawDocs);

  // Initialize PGVectorStore pointing to our specific table
  const vectorStore = await PGVectorStore.initialize(embeddings, {
    pool: pool,
    tableName: "scheme_vectors",
    columns: {
      idColumnName: "id",
      vectorColumnName: "embedding",
      contentColumnName: "content",
      metadataColumnName: "metadata",
    }
  });
  
  // Clear existing to avoid duplicates in this demo
  await pool.query('TRUNCATE TABLE scheme_vectors');

  await vectorStore.addDocuments(docs);
  console.log(`✅ Ingested ${docs.length} chunks into Supabase pgvector!`);
};

// Ask a question using RAG
const askQuestion = async (question, language = 'en') => {
  const vectorStore = await PGVectorStore.initialize(embeddings, {
    pool: pool,
    tableName: "scheme_vectors",
    columns: {
      idColumnName: "id",
      vectorColumnName: "embedding",
      contentColumnName: "content",
      metadataColumnName: "metadata",
    }
  });

  const retriever = vectorStore.asRetriever({ k: 3 });

  const langInstruction = language === 'gu' 
    ? "IMPORTANT: You MUST write your final answer entirely in the Gujarati (ગુજરાતી) language."
    : "You must write your final answer in English.";

  const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful government assistant for the Pravi platform.
Answer the user's question based ONLY on the provided context about government schemes.
If the answer is not in the context, exactly say: "I couldn't find this information in the official scheme guidelines."
Do not make up requirements, eligibility criteria, or verdicts.
Do not use any markdown formatting like ** or # in your response, use plain text only.

${langInstruction}

Context: {context}

Question: {input}

Answer:`);

  // Retrieve relevant documents
  const docs = await retriever.invoke(question);
  const contextText = docs.map(doc => doc.pageContent).join("\n\n");
  const sources = [...new Set(docs.map(doc => doc.metadata.source))]; 

  // Execute the chain
  const answerChain = promptTemplate.pipe(llm).pipe(new StringOutputParser());
  let answer = await answerChain.invoke({
    context: contextText,
    input: question
  });

  if (sources.length > 0) {
    const sourceLabel = language === 'gu' ? 'સ્ત્રોત:' : 'Source:';
    answer += `\n\n(${sourceLabel} ${sources.join(', ')})`;
  }

  return { answer, sources };
};

// Ingest a single new markdown file
const ingestSingleFile = async (filePath, schemeName) => {
  console.log(`Starting ingestion for single file: ${schemeName}`);
  const content = fs.readFileSync(filePath, 'utf8');
  const rawDoc = new Document({ pageContent: content, metadata: { source: schemeName } });

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  
  const docs = await textSplitter.splitDocuments([rawDoc]);

  const vectorStore = await PGVectorStore.initialize(embeddings, {
    pool: pool,
    tableName: "scheme_vectors",
    columns: {
      idColumnName: "id",
      vectorColumnName: "embedding",
      contentColumnName: "content",
      metadataColumnName: "metadata",
    }
  });

  await vectorStore.addDocuments(docs);
  console.log(`✅ Ingested ${docs.length} chunks from ${schemeName} into Supabase pgvector!`);
};

// Delete vectors by scheme name
const deleteVectorsByScheme = async (schemeName) => {
  await pool.query("DELETE FROM scheme_vectors WHERE metadata->>'source' = $1", [schemeName]);
  console.log('Deleted vectors for', schemeName);
};

module.exports = {
  ingestDocuments,
  ingestSingleFile,
  askQuestion,
  deleteVectorsByScheme
};
