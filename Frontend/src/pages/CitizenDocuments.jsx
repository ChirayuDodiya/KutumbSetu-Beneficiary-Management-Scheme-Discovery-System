import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const CitizenDocuments = () => {
  const [family, setFamily] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [docType, setDocType] = useState('Aadhaar Card');
  const [file, setFile] = useState(null);

  const fetchFamilyAndDocs = async () => {
    try {
      const famRes = await api.get('/families/my');
      const fam = famRes.data.data;
      setFamily(fam);
      
      if (fam) {
        const docRes = await api.get(`/families/${fam.id}/documents`);
        setDocuments(docRes.data.data);
      }
    } catch (err) {
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyAndDocs();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    setError('');
    setSuccess('');
    setUploading(true);

    const formData = new FormData();
    formData.append('document_type', docType);
    formData.append('file', file);

    try {
      await api.post(`/families/${family.id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('✅ Document successfully uploaded to Supabase Storage!');
      setFile(null);
      fetchFamilyAndDocs();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!family) return <div className="p-10 text-center text-red-600">Please create your family profile first.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FileText className="mr-2 text-blue-700" /> My Documents Vault
        </h2>
      </div>

      {error && <div className="bg-red-50 p-4 rounded text-red-700 text-sm flex items-center"><AlertCircle className="w-4 h-4 mr-2"/> {error}</div>}
      {success && <div className="bg-green-50 p-4 rounded text-green-700 text-sm flex items-center"><CheckCircle className="w-4 h-4 mr-2"/> {success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Upload Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-indigo-700" /> Upload New Document
          </h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
              <select className="w-full px-3 py-2 border rounded" value={docType} onChange={e => setDocType(e.target.value)}>
                <option>Aadhaar Card</option>
                <option>Income Certificate</option>
                <option>Caste Certificate</option>
                <option>Ration Card</option>
                <option>Bank Passbook</option>
              </select>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <input type="file" required onChange={(e) => setFile(e.target.files[0])} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>

            <button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50 transition">
              {uploading ? 'Uploading to S3...' : 'Upload Document'}
            </button>
          </form>
        </div>

        {/* Documents List */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4">Uploaded Documents</h3>
          <div className="space-y-3">
            {documents.map(doc => (
              <div key={doc.id} className="p-3 border border-gray-200 rounded flex flex-col bg-gray-50">
                <span className="font-bold text-sm text-gray-800">{doc.document_type}</span>
                <span className="text-xs text-gray-500 mb-2">Status: {doc.status}</span>
                <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                  View Document
                </a>
              </div>
            ))}
            {documents.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No documents uploaded yet.</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CitizenDocuments;
