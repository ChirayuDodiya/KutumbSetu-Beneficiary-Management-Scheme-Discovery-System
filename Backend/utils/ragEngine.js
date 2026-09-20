const { ChatGroq } = require("@langchain/groq");
const { HuggingFaceInferenceEmbeddings } = require("@langchain/community/embeddings/hf");
const { Pinecone } = require("@pinecone-database/pinecone");
const { PineconeStore } = require("@langchain/pinecone");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const fs = require('fs');
const path = require('path');
const { Document } = require("@langchain/core/documents");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");

// Pinecone uses VECTOR_DB_URL as per the user's .env setup
const pc = new Pinecone({
  apiKey: process.env.VECTOR_DB_URL,
});
const indexName = process.env.PINECONE_INDEX || 'pravi-schemes';

// Initialize Embeddings
const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACEHUB_API_KEY,
  // We can use a fast model suitable for QA
  model: "sentence-transformers/all-MiniLM-L6-v2", 
});

// Initialize Groq LLM
const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  modelName: "llama3-8b-8192", // Fast and good for simple RAG
  temperature: 0
});

// Ingest markdown documents into Pinecone
const ingestDocuments = async () => {
  console.log("Starting ingestion to Pinecone...");
  const docsDir = path.join(__dirname, '../data/scheme_docs');
  const files = fs.readdirSync(docsDir);
  
  let rawDocs = [];
  for (const file of files) {
    if (file.endsWith('.md')) {
      const content = fs.readFileSync(path.join(docsDir, file), 'utf8');
      rawDocs.push(new Document({ pageContent: content, metadata: { source: file } }));
    }
  }

  // Split into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  
  const docs = await textSplitter.splitDocuments(rawDocs);

  // Store in Pinecone
  const pineconeIndex = pc.Index(indexName);
  
  await PineconeStore.fromDocuments(docs, embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
  });

  console.log(`✅ Ingested ${docs.length} chunks into Pinecone index: ${indexName}`);
};

// Ask a question using RAG
const askQuestion = async (question) => {
  const pineconeIndex = pc.Index(indexName);
  
  const vectorStore = await PineconeStore.fromExistingIndex(
    embeddings,
    { pineconeIndex }
  );

  const retriever = vectorStore.asRetriever({ k: 3 });

  // Custom Prompt focusing on fallback logic if not found
  const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful government assistant for the Pravi platform.
Answer the user's question based ONLY on the provided context about government schemes.
If the answer is not in the context, exactly say: "I couldn't find this information in the official scheme guidelines."
Do not make up requirements, eligibility criteria, or verdicts.

Context: {context}

Question: {input}

Answer:`);

  // Retrieve relevant documents
  const docs = await retriever.invoke(question);
  const contextText = docs.map(doc => doc.pageContent).join("\n\n");
  const sources = [...new Set(docs.map(doc => doc.metadata.source))]; // Unique sources

  // Execute the chain
  const answerChain = promptTemplate.pipe(llm).pipe(new StringOutputParser());
  const answer = await answerChain.invoke({
    context: contextText,
    input: question
  });

  return {
    answer,
    sources
  };
};

module.exports = {
  ingestDocuments,
  askQuestion
};
