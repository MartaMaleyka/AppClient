import React, { useState, useEffect, useRef } from 'react';
import './FileManager.css';

interface FileAttachment {
  id: number;
  original_filename: string;
  stored_filename: string;
  file_size: number;
  mime_type: string;
  upload_date: string;
  uploaded_by_username: string;
  related_form_id?: number;
  related_response_id?: number;
  file_path: string;
}

interface FileStats {
  total_files: number;
  total_size: number;
  image_files: number;
  document_files: number;
  video_files: number;
  audio_files: number;
  archive_files: number;
}

const FileManager: React.FC = () => {
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
    fetchStats();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/files', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      } else {
        console.error('Error fetching files');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/files/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setUploading(false);
          setUploadProgress(0);
          fetchFiles();
          fetchStats();
          alert('¡Archivos subidos exitosamente!');
        } else {
          setUploading(false);
          setUploadProgress(0);
          alert('Error al subir archivos');
        }
      });

      xhr.addEventListener('error', () => {
        setUploading(false);
        setUploadProgress(0);
        alert('Error al subir archivos');
      });

      xhr.open('POST', '/api/files/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);
      xhr.send(formData);
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploading(false);
      setUploadProgress(0);
      alert('Error al subir archivos');
    }
  };

  const handleDownload = async (file: FileAttachment) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.original_filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error al descargar archivo');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error al descargar archivo');
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchFiles();
        fetchStats();
        alert('¡Archivo eliminado exitosamente!');
      } else {
        alert('Error al eliminar archivo');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error al eliminar archivo');
    }
  };

  const handlePreviewFile = (file: FileAttachment) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
    return 'other';
  };

  const getFileIcon = (mimeType: string) => {
    const fileType = getFileType(mimeType);
    switch (fileType) {
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      case 'document': return '📄';
      case 'archive': return '📦';
      default: return '📎';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredFiles = files.filter(file => {
    const matchesType = selectedFileType === 'all' || getFileType(file.mime_type) === selectedFileType;
    const matchesSearch = file.original_filename.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="file-manager">
      <div className="file-header">
        <h2>Gestor de Archivos</h2>
        <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
          Subir Archivos
        </button>
      </div>

      {stats && (
        <div className="file-stats">
          <div className="stat-item">
            <span className="stat-number">{stats.total_files}</span>
            <span className="stat-label">Total de Archivos</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{formatFileSize(stats.total_size)}</span>
            <span className="stat-label">Tamaño Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.image_files}</span>
            <span className="stat-label">Imágenes</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.document_files}</span>
            <span className="stat-label">Documentos</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.video_files}</span>
            <span className="stat-label">Videos</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.audio_files}</span>
            <span className="stat-label">Audio</span>
          </div>
        </div>
      )}

      <div className="file-filters">
        <div className="filter-group">
                        <label>Tipo de Archivo</label>
          <select 
            value={selectedFileType} 
            onChange={(e) => setSelectedFileType(e.target.value)}
          >
            <option value="all">Todos los Tipos</option>
            <option value="image">Imágenes</option>
            <option value="document">Documentos</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="archive">Archivos</option>
            <option value="other">Otros</option>
          </select>
        </div>

        <div className="filter-group">
                        <label>Buscar</label>
          <input
            type="text"
                          placeholder="Buscar archivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div 
        className={`upload-area ${dragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <h3>Arrastra y Suelta Archivos Aquí</h3>
        <p>o haz clic en el botón de subir arriba</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="file-input"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        />
        
        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="progress-text">{Math.round(uploadProgress)}% subido</div>
          </div>
        )}
      </div>

      {filteredFiles.length === 0 ? (
        <div className="empty-files">
          <h3>No se encontraron archivos</h3>
          <p>
            {searchTerm || selectedFileType !== 'all' 
              ? 'Intenta ajustar tus criterios de búsqueda o filtros.'
              : '¡Sube tu primer archivo para empezar!'
            }
          </p>
          {!searchTerm && selectedFileType === 'all' && (
            <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
              Sube tu Primer Archivo
            </button>
          )}
        </div>
      ) : (
        <div className="file-grid">
          {filteredFiles.map(file => (
            <div key={file.id} className="file-card">
              <div className="file-icon">
                <span className="file-type-icon">{getFileIcon(file.mime_type)}</span>
              </div>
              
              <div className="file-info">
                <h3>{file.original_filename}</h3>
                <div className="file-meta">
                  <span className="file-size">{formatFileSize(file.file_size)}</span>
                  <span className="file-type">{getFileType(file.mime_type)}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '15px' }}>
                  Subido por {file.uploaded_by_username} el {formatDate(file.upload_date)}
                </div>
              </div>

              <div className="file-actions">
                <button 
                  className="file-btn download-btn"
                  onClick={() => handleDownload(file)}
                >
                  Descargar
                </button>
                <button 
                  className="file-btn preview-btn"
                  onClick={() => handlePreviewFile(file)}
                >
                  Vista Previa
                </button>
                <button 
                  className="file-btn delete-file-btn"
                  onClick={() => handleDeleteFile(file.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPreviewModal && previewFile && (
        <div className="file-preview-modal">
          <div className="preview-content">
            <div className="preview-header">
              <h3>{previewFile.original_filename}</h3>
              <button className="close-btn" onClick={() => setShowPreviewModal(false)}>
                ×
              </button>
            </div>

            {getFileType(previewFile.mime_type) === 'image' && (
              <img 
                src={`/api/files/${previewFile.id}/preview`}
                alt={previewFile.original_filename}
                className="preview-image"
              />
            )}

            <div className="preview-details">
              <div className="detail-item">
                <span className="detail-label">Nombre del Archivo:</span>
                <span className="detail-value">{previewFile.original_filename}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Tamaño del Archivo:</span>
                <span className="detail-value">{formatFileSize(previewFile.file_size)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Tipo de Archivo:</span>
                <span className="detail-value">{previewFile.mime_type}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Fecha de Subida:</span>
                <span className="detail-value">{formatDate(previewFile.upload_date)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Subido Por:</span>
                <span className="detail-value">{previewFile.uploaded_by_username}</span>
              </div>
            </div>

            <div className="file-actions">
              <button 
                className="file-btn download-btn"
                onClick={() => handleDownload(previewFile)}
              >
                Descargar
              </button>
              <button 
                className="file-btn delete-file-btn"
                onClick={() => {
                  handleDeleteFile(previewFile.id);
                  setShowPreviewModal(false);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager; 