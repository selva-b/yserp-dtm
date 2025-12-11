/**
 * Global Upload State Management Store
 *
 * Manages all active and recent upload operations across the application.
 * Supports multi-file, multi-project concurrent uploads with persistence.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UploadStatus = 'pending' | 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface UploadFileState {
  id: string; // Unique upload ID
  sessionId: string | null; // Backend session ID
  filename: string;
  fileSize: number;
  mimeType?: string;

  // Context
  entityType: 'bid' | 'project';
  entityId: string;
  drawingId?: string;
  fileContext: 'version' | 'file' | 'ticket' | 'status-cadd' | 'status-pdf' | 'base-cad' | 'base-pdf';

  // Progress
  status: UploadStatus;
  progress: number; // 0-100
  uploadedChunks: number;
  totalChunks: number;
  chunkSize: number;

  // Timestamps
  startedAt: string;
  lastUpdatedAt: string;
  completedAt?: string;

  // Result
  fileUrl?: string;
  error?: string;
}

interface UploadStore {
  uploads: Record<string, UploadFileState>;

  // Actions
  addUpload: (upload: UploadFileState) => void;
  updateUpload: (id: string, updates: Partial<UploadFileState>) => void;
  removeUpload: (id: string) => void;
  clearCompleted: () => void;
  clearFailed: () => void;
  clearAll: () => void;

  // Queries
  getUpload: (id: string) => UploadFileState | undefined;
  getActiveUploads: () => UploadFileState[];
  getUploadsByEntity: (entityType: string, entityId: string) => UploadFileState[];
  getUploadsByDrawing: (entityType: string, entityId: string, drawingId: string) => UploadFileState[];
  hasActiveUploads: () => boolean;
  hasActiveUploadsForEntity: (entityType: string, entityId: string) => boolean;
  hasActiveUploadsForDrawing: (entityType: string, entityId: string, drawingId: string) => boolean;
}

export const useUploadStore = create<UploadStore>()(
  persist(
    (set, get) => ({
      uploads: {},

      addUpload: (upload) =>
        set((state) => ({
          uploads: {
            ...state.uploads,
            [upload.id]: upload,
          },
        })),

      updateUpload: (id, updates) =>
        set((state) => ({
          uploads: {
            ...state.uploads,
            [id]: {
              ...state.uploads[id],
              ...updates,
              lastUpdatedAt: new Date().toISOString(),
            },
          },
        })),

      removeUpload: (id) =>
        set((state) => {
          console.log('[useUploadStore] removeUpload called for:', id);
          console.log('[useUploadStore] Before removal, uploads count:', Object.keys(state.uploads).length);
          const { [id]: removed, ...rest } = state.uploads;
          console.log('[useUploadStore] After removal, uploads count:', Object.keys(rest).length);
          console.log('[useUploadStore] Removed upload:', removed?.filename);
          return { uploads: rest };
        }),

      clearCompleted: () =>
        set((state) => ({
          uploads: Object.fromEntries(
            Object.entries(state.uploads).filter(
              ([_, upload]) => upload.status !== 'completed'
            )
          ),
        })),

      clearFailed: () =>
        set((state) => {
          console.log('[useUploadStore] clearFailed called');
          const filtered = Object.fromEntries(
            Object.entries(state.uploads).filter(
              ([_, upload]) => upload.status !== 'failed' && upload.status !== 'cancelled'
            )
          );
          console.log('[useUploadStore] Cleared failed uploads. Before:', Object.keys(state.uploads).length, 'After:', Object.keys(filtered).length);
          return { uploads: filtered };
        }),

      clearAll: () => set({ uploads: {} }),

      getUpload: (id) => get().uploads[id],

      getActiveUploads: () =>
        Object.values(get().uploads).filter(
          (upload) =>
            upload.status === 'uploading' ||
            upload.status === 'pending' ||
            upload.status === 'paused'
        ),

      getUploadsByEntity: (entityType, entityId) =>
        Object.values(get().uploads).filter(
          (upload) =>
            upload.entityType === entityType && upload.entityId === entityId
        ),

      getUploadsByDrawing: (entityType, entityId, drawingId) =>
        Object.values(get().uploads).filter(
          (upload) =>
            upload.entityType === entityType &&
            upload.entityId === entityId &&
            upload.drawingId === drawingId
        ),

      hasActiveUploads: () => get().getActiveUploads().length > 0,

      hasActiveUploadsForEntity: (entityType, entityId) =>
        get()
          .getUploadsByEntity(entityType, entityId)
          .some(
            (upload) =>
              upload.status === 'uploading' ||
              upload.status === 'pending' ||
              upload.status === 'paused'
          ),

      hasActiveUploadsForDrawing: (entityType, entityId, drawingId) =>
        get()
          .getUploadsByDrawing(entityType, entityId, drawingId)
          .some(
            (upload) =>
              upload.status === 'uploading' ||
              upload.status === 'pending' ||
              upload.status === 'paused'
          ),
    }),
    {
      name: 'yserp-upload-store',
      // Only persist essential data
      partialize: (state) => ({ uploads: state.uploads }),
    }
  )
);
