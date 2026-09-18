import apiClient from './api';
import { PilotSubmission, PilotSubmissionStatus } from '../types';

export interface PilotSubmissionCreateParams {
  pilot_id: number;
  results?: string;
  kpi_results?: Record<string, any>;
  evidence?: Record<string, any>;
}

export interface PilotSubmissionUpdateParams {
  results?: string;
  kpi_results?: Record<string, any>;
  evidence?: Record<string, any>;
  status?: PilotSubmissionStatus;
}

export const submissionService = {
  createSubmission: async (data: PilotSubmissionCreateParams): Promise<PilotSubmission> => {
    const response = await apiClient.post<PilotSubmission>('/pilot-submissions', data);
    return response.data;
  },

  updateSubmission: async (id: number, data: PilotSubmissionUpdateParams): Promise<PilotSubmission> => {
    const response = await apiClient.put<PilotSubmission>(`/pilot-submissions/${id}`, data);
    return response.data;
  },

  submitSubmission: async (id: number): Promise<PilotSubmission> => {
    const response = await apiClient.post<PilotSubmission>(`/pilot-submissions/${id}/submit`);
    return response.data;
  },

  listSubmissions: async (params?: {
    pilot_id?: number;
    status?: PilotSubmissionStatus;
    skip?: number;
    limit?: number;
  }): Promise<PilotSubmission[]> => {
    const response = await apiClient.get<PilotSubmission[]>('/pilot-submissions', { params });
    return response.data;
  },

  getSubmission: async (id: number): Promise<PilotSubmission> => {
    const response = await apiClient.get<PilotSubmission>(`/pilot-submissions/${id}`);
    return response.data;
  },

  uploadEvidenceFile: async (file: File): Promise<{
    filename: string;
    saved_name: string;
    url: string;
    size_bytes: number;
    content_type: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/pilot-submissions/upload-evidence', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadEvidenceFile: async (filename: string): Promise<Blob> => {
    const cleanFilename = filename.includes('/') ? filename.split('/').pop()! : filename;
    const response = await apiClient.get(`/pilot-submissions/evidence-files/${encodeURIComponent(cleanFilename)}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  viewEvidenceFile: async (fileUrlOrName: string, originalFilename?: string): Promise<void> => {
    const cleanFilename = fileUrlOrName.includes('/') ? fileUrlOrName.split('/').pop()! : fileUrlOrName;
    
    // Open a blank tab synchronously on click to guarantee popup blockers do not block the window
    let newTab: Window | null = null;
    try {
      newTab = window.open('about:blank', '_blank');
      if (newTab) {
        newTab.document.title = 'Opening Document...';
        newTab.document.body.innerHTML = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; color: #1e293b;">
            <div style="width: 36px; height: 36px; border: 3px solid #cbd5e1; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px;"></div>
            <p style="font-size: 14px; font-weight: 600; margin: 0 0 6px 0;">Loading Evidence Document</p>
            <p style="font-size: 12px; color: #64748b; margin: 0;">Retrieving authenticated PDF from secure repository...</p>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
          </div>
        `;
      }
    } catch {
      // Ignore if tab opening fails synchronously
    }

    try {
      const blob = await submissionService.downloadEvidenceFile(cleanFilename);
      const targetName = (originalFilename || cleanFilename).toLowerCase();
      const mimeType = targetName.endsWith('.pdf')
        ? 'application/pdf'
        : targetName.endsWith('.png')
        ? 'image/png'
        : targetName.endsWith('.jpg') || targetName.endsWith('.jpeg')
        ? 'image/jpeg'
        : targetName.endsWith('.csv')
        ? 'text/csv'
        : blob.type && blob.type !== 'application/octet-stream'
        ? blob.type
        : 'application/pdf';

      const typedBlob = new Blob([blob], { type: mimeType });
      const objectUrl = window.URL.createObjectURL(typedBlob);

      if (newTab && !newTab.closed) {
        newTab.location.href = objectUrl;
      } else {
        const opened = window.open(objectUrl, '_blank');
        if (!opened) {
          // If popup is blocked, fallback to downloading directly
          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = originalFilename || cleanFilename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }

      setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 120000);
    } catch (err: any) {
      if (newTab && !newTab.closed) {
        newTab.close();
      }
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed === 'object') {
            err.response.data = parsed;
          }
        } catch {
          // Ignore parse errors
        }
      }
      throw err;
    }
  },

  downloadEvidenceFileAs: async (fileUrlOrName: string, originalFilename?: string): Promise<void> => {
    const cleanFilename = fileUrlOrName.includes('/') ? fileUrlOrName.split('/').pop()! : fileUrlOrName;
    try {
      const blob = await submissionService.downloadEvidenceFile(cleanFilename);
      const targetName = (originalFilename || cleanFilename).toLowerCase();
      const mimeType = targetName.endsWith('.pdf')
        ? 'application/pdf'
        : blob.type || 'application/octet-stream';
      const typedBlob = new Blob([blob], { type: mimeType });
      const url = window.URL.createObjectURL(typedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalFilename || cleanFilename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);
    } catch (err: any) {
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed === 'object') {
            err.response.data = parsed;
          }
        } catch {
          // Ignore parse errors
        }
      }
      throw err;
    }
  },

  downloadOrViewFile: async (fileUrlOrName: string, originalFilename?: string): Promise<void> => {
    return submissionService.viewEvidenceFile(fileUrlOrName, originalFilename);
  },
};

export default submissionService;

