import React, { useState, useEffect } from 'react';
import './VersionManager.css';

interface Version {
  id: number;
  version_number: number;
  title: string;
  description: string;
  is_active: boolean;
  created_by_username: string;
  created_at: string;
  questions: any[];
}

interface Comparison {
  version1: {
    version_number: number;
    title: string;
    question_count: number;
  };
  version2: {
    version_number: number;
    title: string;
    question_count: number;
  };
  differences: {
    title_changed: boolean;
    questions_added: any[];
    questions_removed: any[];
    questions_modified: any[];
  };
}

interface VersionManagerProps {
  formId: number;
}

const VersionManager: React.FC<VersionManagerProps> = ({ formId }) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [selectedVersion1, setSelectedVersion1] = useState<number | null>(null);
  const [selectedVersion2, setSelectedVersion2] = useState<number | null>(null);

  useEffect(() => {
    fetchVersions();
  }, [formId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/forms/${formId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data);
      } else {
        console.error('Error fetching versions');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    try {
      const response = await fetch(`/api/forms/${formId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchVersions();
        alert('Version created successfully!');
      } else {
        alert('Error creating version');
      }
    } catch (error) {
      console.error('Error creating version:', error);
      alert('Error creating version');
    }
  };

  const handleActivateVersion = async (versionId: number) => {
    try {
      const response = await fetch(`/api/forms/${formId}/versions/${versionId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchVersions();
        alert('Version activated successfully!');
      } else {
        alert('Error activating version');
      }
    } catch (error) {
      console.error('Error activating version:', error);
      alert('Error activating version');
    }
  };

  const handleDeleteVersion = async (versionId: number) => {
    if (!window.confirm('Are you sure you want to delete this version?')) {
      return;
    }

    try {
      const response = await fetch(`/api/forms/${formId}/versions/${versionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchVersions();
        alert('Version deleted successfully!');
      } else {
        alert('Error deleting version');
      }
    } catch (error) {
      console.error('Error deleting version:', error);
      alert('Error deleting version');
    }
  };

  const handleCompareVersions = async () => {
    if (!selectedVersion1 || !selectedVersion2) {
      alert('Please select two versions to compare');
      return;
    }

    try {
      const response = await fetch(`/api/forms/${formId}/versions/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          version1_id: selectedVersion1,
          version2_id: selectedVersion2
        })
      });

      if (response.ok) {
        const data = await response.json();
        setComparison(data);
        setShowCompareModal(true);
      } else {
        alert('Error comparing versions');
      }
    } catch (error) {
      console.error('Error comparing versions:', error);
      alert('Error comparing versions');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="version-manager">
      <div className="version-header">
        <h2>Version Manager</h2>
        <button className="create-version-btn" onClick={handleCreateVersion}>
          Create New Version
        </button>
      </div>

      {versions.length === 0 ? (
        <div className="empty-versions">
          <h3>No versions found</h3>
          <p>Create your first version to get started!</p>
          <button className="create-version-btn" onClick={handleCreateVersion}>
            Create First Version
          </button>
        </div>
      ) : (
        <>
          <div className="version-list">
            {versions.map(version => (
              <div key={version.id} className={`version-card ${version.is_active ? 'active' : ''}`}>
                <div className="version-header-info">
                  <div className="version-info">
                    <h3>{version.title}</h3>
                    <span className="version-number">v{version.version_number}</span>
                    <p className="version-description">{version.description}</p>
                  </div>
                </div>

                <div className="version-meta">
                  <span>By {version.created_by_username}</span>
                  <span>{formatDate(version.created_at)}</span>
                </div>

                <div className="version-stats">
                  <div className="stat-item">
                    <span className="stat-number">{version.questions.length}</span>
                    <span className="stat-label">Questions</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{version.is_active ? 'Active' : 'Inactive'}</span>
                    <span className="stat-label">Status</span>
                  </div>
                </div>

                <div className="version-actions">
                  <button 
                    className="version-btn activate-btn"
                    onClick={() => handleActivateVersion(version.id)}
                    disabled={version.is_active}
                  >
                    {version.is_active ? 'Active' : 'Activate'}
                  </button>
                  <button 
                    className="version-btn compare-btn"
                    onClick={() => {
                      setSelectedVersion1(version.id);
                      setSelectedVersion2(null);
                    }}
                  >
                    Select for Compare
                  </button>
                  <button 
                    className="version-btn delete-version-btn"
                    onClick={() => handleDeleteVersion(version.id)}
                    disabled={version.is_active}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedVersion1 && (
            <div style={{ marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h4>Compare Versions</h4>
              <p>Selected version: v{versions.find(v => v.id === selectedVersion1)?.version_number}</p>
              <div style={{ marginTop: '10px' }}>
                <select 
                  value={selectedVersion2 || ''} 
                  onChange={(e) => setSelectedVersion2(Number(e.target.value))}
                  style={{ marginRight: '10px', padding: '8px' }}
                >
                  <option value="">Select second version</option>
                  {versions
                    .filter(v => v.id !== selectedVersion1)
                    .map(version => (
                      <option key={version.id} value={version.id}>
                        v{version.version_number} - {version.title}
                      </option>
                    ))
                  }
                </select>
                <button 
                  className="version-btn compare-btn"
                  onClick={handleCompareVersions}
                  disabled={!selectedVersion2}
                >
                  Compare
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showCompareModal && comparison && (
        <div className="compare-modal">
          <div className="compare-content">
            <div className="compare-header">
              <h3>Version Comparison</h3>
              <button className="close-btn" onClick={() => setShowCompareModal(false)}>
                ×
              </button>
            </div>

            <div className="comparison-summary">
              <div className="version-summary">
                <h4>{comparison.version1.title}</h4>
                <span className="version-number">v{comparison.version1.version_number}</span>
                <p>{comparison.version1.question_count} questions</p>
              </div>
              <div className="version-summary">
                <h4>{comparison.version2.title}</h4>
                <span className="version-number">v{comparison.version2.version_number}</span>
                <p>{comparison.version2.question_count} questions</p>
              </div>
            </div>

            <div className="differences-section">
              <h4>Changes</h4>
              
              {comparison.differences.title_changed && (
                <div className="difference-item">
                  <h5>Title Changed</h5>
                  <div className="difference-details">
                    The form title has been modified between versions.
                  </div>
                </div>
              )}

              {comparison.differences.questions_added.length > 0 && (
                <div className="difference-item">
                  <h5>Questions Added ({comparison.differences.questions_added.length})</h5>
                  <ul className="changes-list">
                    {comparison.differences.questions_added.map((question, index) => (
                      <li key={index} className="change-added">
                        + {question.question_text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {comparison.differences.questions_removed.length > 0 && (
                <div className="difference-item">
                  <h5>Questions Removed ({comparison.differences.questions_removed.length})</h5>
                  <ul className="changes-list">
                    {comparison.differences.questions_removed.map((question, index) => (
                      <li key={index} className="change-removed">
                        - {question.question_text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {comparison.differences.questions_modified.length > 0 && (
                <div className="difference-item">
                  <h5>Questions Modified ({comparison.differences.questions_modified.length})</h5>
                  {comparison.differences.questions_modified.map((question, index) => (
                    <div key={index} style={{ marginBottom: '10px' }}>
                      <strong className="change-modified">{question.question_text}</strong>
                      {Object.entries(question.changes).map(([changeType, change]) => (
                        <div key={changeType} style={{ marginLeft: '20px', fontSize: '12px' }}>
                          <span className="change-modified">{changeType}:</span> {change.from} → {change.to}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {!comparison.differences.title_changed && 
               comparison.differences.questions_added.length === 0 &&
               comparison.differences.questions_removed.length === 0 &&
               comparison.differences.questions_modified.length === 0 && (
                <div className="difference-item">
                  <h5>No Changes</h5>
                  <div className="difference-details">
                    No differences found between the selected versions.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionManager; 