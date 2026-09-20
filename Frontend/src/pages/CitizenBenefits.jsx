import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Landmark, CheckCircle, XCircle, ShieldCheck, FileText, Upload } from 'lucide-react';

const CitizenBenefits = () => {
  const [family, setFamily] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [myDocuments, setMyDocuments] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState({}); // { "Aadhaar Card": "https://..." }
  const [applying, setApplying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const famRes = await api.get('/families/my');
        const fam = famRes.data.data;
        if (!fam) {
          setError('Family profile not found.');
          setLoading(false);
          return;
        }
        setFamily(fam);

        if (fam.status === 'VERIFIED') {
          const schemeRes = await api.get(`/families/${fam.id}/schemes`);
          setSchemes(schemeRes.data.data);
          
          const docRes = await api.get(`/families/${fam.id}/documents`);
          setMyDocuments(docRes.data.data);

          const reqRes = await api.get('/benefit-requests');
          setMyRequests(reqRes.data.data);
        }
      } catch (err) {
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openModal = (scheme) => {
    setSelectedScheme(scheme);
    setSelectedDocs({});
  };

  const handleApply = async () => {
    // Validate that all required docs are attached
    const missingDocs = selectedScheme.required_documents.filter(doc => !selectedDocs[doc]);
    if (missingDocs.length > 0) {
      alert(`Please select your uploaded document for: ${missingDocs.join(', ')}`);
      return;
    }

    setApplying(true);
    
    // Create an array of attached document objects to save in the DB
    const attached = Object.keys(selectedDocs).map(docName => ({
      name: docName,
      url: selectedDocs[docName]
    }));

    try {
      await api.post('/benefit-requests', {
        family_id: family.id,
        scheme_id: selectedScheme.id,
        attached_documents: attached
      });
      alert('Application submitted successfully!');
      setSelectedScheme(null);
      navigate('/citizen/requests');
    } catch (err) {
      if (err.response?.data?.code === 'ALREADY_APPLIED') {
        alert('You have already applied for this scheme.');
      } else {
        alert('Failed to apply. ' + (err.response?.data?.message || ''));
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading benefits...</div>;

  if (error) return <div className="p-10 text-red-600">{error}</div>;

  if (family?.status !== 'VERIFIED') {
    return (
      <div className="bg-yellow-50 p-6 rounded border border-yellow-200 max-w-2xl mx-auto text-center">
        <ShieldCheck className="w-12 h-12 text-yellow-600 mx-auto mb-2" />
        <h2 className="text-xl font-bold text-yellow-800">Verification Pending</h2>
        <p className="text-yellow-700 mt-2">
          You can only explore and apply for benefits once an Officer has verified your Family Profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Landmark className="mr-2 text-green-700" /> Scheme Recommendations
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schemes.map((scheme) => {
          const isEligible = scheme.evaluation.potentiallyApplicable;
          const existingReq = myRequests.find(r => r.scheme_id === scheme.id);
          
          return (
            <div key={scheme.id} className={`border rounded-lg shadow-sm bg-white overflow-hidden flex flex-col ${isEligible ? 'border-green-300' : 'border-gray-200'}`}>
              <div className={`px-4 py-3 border-b flex justify-between items-center ${isEligible ? 'bg-green-50' : 'bg-gray-50'}`}>
                <h3 className="font-bold text-gray-800 truncate" title={scheme.name}>{scheme.name}</h3>
                {isEligible ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
              </div>
              
              <div className="p-4 flex-1">
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{scheme.description}</p>
                {scheme.source && (
                  <a href={scheme.source} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center mb-4">
                    <FileText className="w-3 h-3 mr-1" /> Read Official Guidelines
                  </a>
                )}
                <div className="mb-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Verdict</span>
                  {isEligible ? (
                    <div className="mt-1 text-sm text-green-700 font-medium">Eligible based on profile</div>
                  ) : (
                    <div className="mt-1 text-sm text-red-600">
                      Not Eligible: {scheme.evaluation.failedChecks.map(c => c.rule).join(', ')}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 border-t bg-gray-50 flex flex-col justify-end">
                {existingReq && (existingReq.status === 'APPROVED' || existingReq.status === 'UNDER_REVIEW') ? (
                  <button 
                    disabled
                    className={`px-4 py-2 font-medium text-sm w-full rounded ${
                      existingReq.status === 'APPROVED' ? 'bg-green-100 text-green-800 border border-green-200' :
                      'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}
                  >
                    {existingReq.status === 'APPROVED' ? 'Application Approved' : 'Under Review'}
                  </button>
                ) : existingReq && existingReq.status === 'REJECTED' ? (
                  <>
                    <button 
                      onClick={() => openModal(scheme)}
                      className="px-4 py-2 bg-red-600 border border-red-700 text-white rounded hover:bg-red-700 font-medium text-sm w-full shadow-sm"
                    >
                      Re-apply (Previously Rejected)
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => openModal(scheme)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium text-sm w-full"
                  >
                    View Details & Apply
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedScheme && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">{selectedScheme.name}</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-bold text-gray-700 mb-1">Description</h4>
                <p className="text-gray-600 text-sm">{selectedScheme.description}</p>
              </div>

              <div>
                <h4 className="font-bold text-gray-700 mb-2">Required Documents (Must Attach)</h4>
                {selectedScheme.required_documents.length === 0 ? (
                  <p className="text-sm text-gray-500">No documents required.</p>
                ) : (
                  <ul className="space-y-3">
                    {selectedScheme.required_documents.map((doc, idx) => (
                      <li key={idx} className="p-3 border rounded bg-blue-50">
                        <span className="font-semibold text-sm text-gray-800 block mb-1">{doc}</span>
                        <select 
                          className="w-full border-gray-300 rounded text-sm p-2"
                          value={selectedDocs[doc] || ''}
                          onChange={(e) => setSelectedDocs({...selectedDocs, [doc]: e.target.value})}
                        >
                          <option value="">-- Select from My Documents --</option>
                          {myDocuments.map(md => (
                            <option key={md.id} value={md.file_path}>{md.document_type}</option>
                          ))}
                        </select>
                      </li>
                    ))}
                  </ul>
                )}
                {myDocuments.length === 0 && selectedScheme.required_documents.length > 0 && (
                  <p className="text-xs text-red-600 mt-2 flex items-center">
                    <Upload className="w-3 h-3 mr-1" /> You have not uploaded any documents to your vault. Please go to "My Documents" first.
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button 
                onClick={() => setSelectedScheme(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              {selectedScheme.evaluation.potentiallyApplicable && (
                <button 
                  onClick={handleApply}
                  disabled={applying || (selectedScheme.required_documents.length > 0 && myDocuments.length === 0)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
                >
                  {applying ? 'Submitting...' : 'Submit Official Application'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CitizenBenefits;
