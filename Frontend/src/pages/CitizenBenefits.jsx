import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Landmark, CheckCircle, XCircle, Info, ShieldCheck, FileText } from 'lucide-react';

const CitizenBenefits = () => {
  const [family, setFamily] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [selectedScheme, setSelectedScheme] = useState(null);
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
        }
      } catch (err) {
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.post('/benefit-requests', {
        family_id: family.id,
        scheme_id: selectedScheme.id
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
                    <p className="text-sm text-green-700 font-medium flex items-center mt-1">
                      Potentially Applicable
                    </p>
                  ) : (
                    <p className="text-sm text-red-600 font-medium flex items-center mt-1">
                      Not Applicable
                    </p>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
                <button 
                  onClick={() => setSelectedScheme(scheme)}
                  className="text-blue-700 hover:text-blue-900 text-sm font-medium flex items-center"
                >
                  <Info className="w-4 h-4 mr-1" /> View Details
                </button>
                {isEligible && (
                  <button 
                    onClick={() => setSelectedScheme(scheme)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium transition"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Details & Apply Modal */}
      {selectedScheme && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h3 className="text-lg font-bold text-gray-800">{selectedScheme.name}</h3>
              <button onClick={() => setSelectedScheme(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1">
              <p className="text-gray-700 mb-6">{selectedScheme.description}</p>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">Eligibility Engine Breakdown</h4>
                
                {selectedScheme.evaluation.passedChecks.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-green-700 flex items-center mb-1">
                      <CheckCircle className="w-4 h-4 mr-1" /> Satisfied Conditions
                    </p>
                    <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                      {selectedScheme.evaluation.passedChecks.map((check, i) => <li key={i}>{check}</li>)}
                    </ul>
                  </div>
                )}

                {selectedScheme.evaluation.failedChecks.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-600 flex items-center mb-1">
                      <XCircle className="w-4 h-4 mr-1" /> Failed Conditions
                    </p>
                    <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                      {selectedScheme.evaluation.failedChecks.map((check, i) => <li key={i}>{check}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-1 flex items-center">
                  <FileText className="w-4 h-4 mr-1" /> Required Documents
                </h4>
                <p className="text-sm text-blue-700">
                  If you apply, an officer will review your family profile. You will need to upload required documents like Income Certificate or Aadhaar Card in your profile to complete the verification.
                </p>
              </div>

            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end rounded-b-lg space-x-3">
              <button onClick={() => setSelectedScheme(null)} className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium">
                Close
              </button>
              {selectedScheme.evaluation.potentiallyApplicable && (
                <button 
                  onClick={handleApply}
                  disabled={applying}
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
