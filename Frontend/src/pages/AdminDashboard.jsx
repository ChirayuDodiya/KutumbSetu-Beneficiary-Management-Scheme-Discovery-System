import React, { useState } from 'react';
import api from '../api/axios';
import { Upload, PlusCircle, CheckCircle, FileText } from 'lucide-react';

const AdminDashboard = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    income_limit: '',
    caste_criteria: 'ANY',
    required_documents: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Error: You must upload a Markdown (.md) file for the AI RAG system.');
      return;
    }
    
    setLoading(true);
    setMessage('');

    // Transform criteria into JSON
    const criteria = {
      max_income: formData.income_limit ? parseInt(formData.income_limit) : null,
      caste: formData.caste_criteria === 'ANY' ? null : formData.caste_criteria
    };

    // Transform required_documents into array
    const docsArray = formData.required_documents.split(',').map(d => d.trim()).filter(d => d);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('criteria', JSON.stringify(criteria));
    data.append('required_documents', JSON.stringify(docsArray));
    data.append('file', file);

    try {
      await api.post('/schemes', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('✅ Scheme created and automatically ingested into the AI RAG database!');
      setFormData({ name: '', description: '', income_limit: '', caste_criteria: 'ANY', required_documents: '' });
      setFile(null);
    } catch (err) {
      setMessage('❌ Failed to upload scheme: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <PlusCircle className="mr-2 text-indigo-700" /> Admin Scheme Portal
        </h2>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-4">Create New Scheme & Teach AI</h3>
        
        {message && (
          <div className={`p-4 mb-6 rounded text-sm ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheme Name</label>
              <input type="text" required className="w-full px-3 py-2 border rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Income Limit (₹)</label>
              <input type="number" className="w-full px-3 py-2 border rounded" placeholder="Leave empty if no limit" value={formData.income_limit} onChange={e => setFormData({...formData, income_limit: e.target.value})} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea required className="w-full px-3 py-2 border rounded h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caste Criteria</label>
              <select className="w-full px-3 py-2 border rounded" value={formData.caste_criteria} onChange={e => setFormData({...formData, caste_criteria: e.target.value})}>
                <option value="ANY">Any Category (No restriction)</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="SEBC">SEBC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Required Documents (Comma separated)</label>
              <input type="text" required className="w-full px-3 py-2 border rounded" placeholder="Aadhaar, Income Certificate" value={formData.required_documents} onChange={e => setFormData({...formData, required_documents: e.target.value})} />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2" /> Upload Scheme Guidelines (for AI RAG)
            </h4>
            <div className="border-2 border-dashed border-gray-300 rounded p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <input type="file" accept=".md,.txt" onChange={(e) => setFile(e.target.files[0])} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              <p className="text-xs text-gray-500 mt-2">Upload a Markdown (.md) or Text file. This will be automatically embedded into Supabase pgvector so the Chatbot can read it.</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded font-medium disabled:opacity-50">
              {loading ? 'Uploading & Teaching AI...' : 'Create Scheme & Teach AI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
