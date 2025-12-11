'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(() => import('@/components/common/PDFViewer'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="text-gray-600">Loading PDF viewer...</div></div>
})
import {
  useDrawing,
  useUpdateDrawing,
  useUpdateDrawingStatus,
  useCreateFileVersion,
  useDeleteFileVersion,
  useDrawingStatusHistory,
  useDrawingFilesByType,
  UpdateDrawingData,
  UpdateDrawingStatusData,
  CreateFileVersionData,
} from '@/hooks/useDrawings'
import {
  useDrawingFiles,
  useUploadDrawingFile,
  useDeleteDrawingFile,
  useDeleteMultipleDrawingFiles,
  useDrawingBaseFiles,
} from '@/hooks/useDrawingFiles'
import { useDrawingTypes, useDrawingStatusCodes } from '@/hooks/useDrawingTypes'
import { useSubSystemsSelectors } from '@/hooks/use-systems'
import { useRevisionHistoryDetail, generateFileDownloadUrl, deleteFileFromAzure } from '@/hooks/useRevisionHistory'
import { useProject } from '@/hooks/useProjects'
import { useAuth } from '@/contexts/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import RevisionHistoryPanel from '@/components/drawings/RevisionHistoryPanel'
import StatusHistoryPanel from '@/components/drawings/StatusHistoryPanel'
import { apiClient } from '@/lib/api-client'
import { getApiUrl } from '@/lib/config'
import ResumableUploadModal from '@/components/common/ResumableUploadModal'
import MultiFileUploadModal from '@/components/common/MultiFileUploadModal'
import InlineFileUpload from '@/components/common/InlineFileUpload'
import UploadProgressIndicator from '@/components/common/UploadProgressIndicator'
import InitialFileUploadModal from '@/components/drawings/InitialFileUploadModal'
import { getActiveSessionsForPage } from '@/lib/upload-session-storage'
import { getFile } from '@/lib/file-storage'
import { useUploadStore } from '@/stores/useUploadStore'

export default function DrawingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const projectId = params.id as string
  const drawingId = params.drawingId as string
  const { user } = useAuth()

  // Check if navigated from tasks
  const fromTasks = searchParams.get('from') === 'tasks'
  const taskId = searchParams.get('taskId')

  const [isEditing, setIsEditing] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [isUploadingInitialFiles, setIsUploadingInitialFiles] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'versions' | 'files' | 'history' | 'revisions'>('details')
  const [showFileUploadModal, setShowFileUploadModal] = useState(false)
  const [showMultiFileUploadModal, setShowMultiFileUploadModal] = useState(false)
  const [multiFileUploadContext, setMultiFileUploadContext] = useState<'status-cadd' | 'status-pdf' | null>(null)
  const [pdfViewerData, setPdfViewerData] = useState<{
    url: string
    filename: string
    uploadedBy?: string
    uploadedAt?: string
  } | null>(null)
  const [caddViewerData, setCaddViewerData] = useState<{
    url: string
    filename: string
    uploadedBy?: string
    uploadedAt?: string
  } | null>(null)
  const [deletingFileUrl, setDeletingFileUrl] = useState<string | null>(null)
  const [fileToDelete, setFileToDelete] = useState<{
    url: string
    filename: string
  } | null>(null)
  const [baseFileToDelete, setBaseFileToDelete] = useState<{
    url: string
    filename: string
  } | null>(null)
  const [deletingBaseFileUrl, setDeletingBaseFileUrl] = useState<string | null>(null)
  const [viewingBaseFile, setViewingBaseFile] = useState<{
    url: string
    filename: string
    type: 'pdf' | 'image'
  } | null>(null)
  const [showResumableModal, setShowResumableModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileContext, setFileContext] = useState<'version' | 'file' | 'status-cadd' | 'status-pdf' | null>(null)
  const [isUploadMinimized, setIsUploadMinimized] = useState(false)
  const [minimizedUploadData, setMinimizedUploadData] = useState<{
    progress: number;
    uploadedChunks: number;
    totalChunks: number;
    isPaused: boolean;
    filename: string;
    sessionId: string | null;
  } | null>(null)
  const [restoredSessionId, setRestoredSessionId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    drawingName: '',
    subSystemId: '',
    plannedSubmissionDate: '',
    drawingTypeId: '',
  })

  const [uploadData, setUploadData] = useState<{
    pdfFile: File | null
    caddFile: File | null
  }>({
    pdfFile: null,
    caddFile: null,
  })

  const [statusData, setStatusData] = useState({
    status: '',
    comment: '',
    codeId: '',
    files: [] as File[],
    caddFiles: [] as File[],
    pdfFiles: [] as File[],
  })

  // Track uploaded files with metadata
  const [uploadedFiles, setUploadedFiles] = useState<{
    cadd: Array<{ name: string; url: string; size: number }>
    pdf: Array<{ name: string; url: string; size: number }>
  }>({ cadd: [], pdf: [] })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  const [statusErrors, setStatusErrors] = useState<Record<string, string>>({})

  const { data: drawing, isLoading, error, refetch: refetchDrawing } = useDrawing(drawingId)
  const { data: statusHistory } = useDrawingStatusHistory(drawingId)
  const { data: project } = useProject(projectId) // Fetch project data for project_number
  const { data: baseFiles, refetch: refetchBaseFiles } = useDrawingBaseFiles(drawingId) // Fetch Base CAD/PDF files

  // Check if there are active uploads for this specific drawing
  const { hasActiveUploadsForDrawing } = useUploadStore()
  const hasActiveUploads = hasActiveUploadsForDrawing('project', projectId, drawingId)

  // Calculate revision version based on drawing status workflow
  // Version format: Major.Minor (e.g., 0.0, 0.1, 0.2, 1.0, 1.1)
  // Rules:
  // - Internal Review → No version update → use latest version
  // - Internal Approval → No version update → use latest version
  // - Internal Revision → Increment MINOR version only (0.0 → 0.1 → 0.2)
  // - Revision Ongoing → Increment MAJOR version only (0.3 → 1.0, 1.2 → 2.0)
  const getRevisionVersion = (currentStatus: string): string => {
    // Default starting version
    if (!statusHistory || statusHistory.length === 0) return '0.0';

    const latestVersion = statusHistory[0]?.revisionVersion || '0.0';
    const [major, minor] = latestVersion.split('.').map(v => parseInt(v, 10) || 0);

    switch (currentStatus) {
      case 'Internal review':
      case 'Internal Approval':
        // No version update - use latest version
        return latestVersion;

      case 'Internal Revision':
      case 'Internal revision':
        // Increment minor version only
        return `${major}.${minor + 1}`;

      case 'Revision ongoing':
        // Increment major version, reset minor to 0
        return `${major + 1}.0`;

      default:
        // For other statuses, use latest version
        return latestVersion;
    }
  };

  const revisionVersion = getRevisionVersion(statusData.status);

  // Get current version from latest status history (for InlineFileUpload currentVersion prop)
  const currentVersion = statusHistory?.[0]?.revisionVersion || '0.0';

  // Get ONLY the initial uploaded files (version 0.0 with "Open" status)
  // Do NOT show recent files - only show the initial version 0.0 Open status files
  const initialOpenStatus = statusHistory?.find(
    s => s.status === 'Open' && s.revisionVersion === '0.0' && s.hasFiles
  )
  const initialStatusHistoryId = initialOpenStatus?.id || ''
  const { data: initialRevisionDetail } = useRevisionHistoryDetail(initialStatusHistoryId)

  // Debug: Log to verify we're getting initial files only
  console.log('=== INITIAL FILES DISPLAY (v0.0 Open) ===')
  console.log('1. All Status History:', statusHistory)
  console.log('2. Initial Open Status (v0.0):', initialOpenStatus)
  console.log('3. Initial Status History ID:', initialStatusHistoryId)
  console.log('4. Initial Revision Detail:', initialRevisionDetail)
  console.log('5. Initial Revision Files:', initialRevisionDetail?.revision_file)
  console.log('==========================================')

  const updateDrawingMutation = useUpdateDrawing(drawingId)
  const updateStatusMutation = useUpdateDrawingStatus(drawingId)
  const createFileVersionMutation = useCreateFileVersion(drawingId)
  const deleteFileVersionMutation = useDeleteFileVersion(drawingId)
  const { data: drawingTypes } = useDrawingTypes()
  const { data: statusCodes } = useDrawingStatusCodes()
  const { data: subSystems } = useSubSystemsSelectors()

  // Fetch files from Azure Storage when Update Status modal opens
  const { data: filesByType } = useDrawingFilesByType(drawingId, { enabled: showStatusModal })

  // Drawing Files
  const [filesPage, setFilesPage] = useState(1)
  const [filesPageSize, setFilesPageSize] = useState(25)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const { data: filesData } = useDrawingFiles(drawingId, { page: filesPage, pageSize: filesPageSize })
  const uploadFileMutation = useUploadDrawingFile(drawingId)
  const deleteFileMutation = useDeleteDrawingFile(drawingId)
  const bulkDeleteMutation = useDeleteMultipleDrawingFiles(drawingId)

  // Handler for viewing CADD files inline
  const handleViewCaddFile = async (fileUrl: string, filename: string, uploadedBy?: string, uploadedAt?: string) => {
    try {
      const { downloadUrl } = await generateFileDownloadUrl(initialStatusHistoryId, fileUrl)
      setCaddViewerData({
        url: downloadUrl,
        filename,
        uploadedBy,
        uploadedAt
      })
    } catch (error: any) {
      console.error('Failed to load file:', error)
      alert(error.message || 'Failed to load file')
    }
  }

  // Handler for viewing base CADD files inline (using direct URL)
  const handleViewBaseCaddFile = async (fileUrl: string, filename: string) => {
    setCaddViewerData({
      url: fileUrl,
      filename
    })
  }

  // Handler for viewing base PDF files inline (using direct URL)
  const handleViewBasePdfFile = async (fileUrl: string, filename: string) => {
    setPdfViewerData({
      url: fileUrl,
      filename
    })
  }

  // Handler for downloading files
  const handleDownloadFile = async (fileUrl: string, filename: string) => {
    try {
      const { downloadUrl } = await generateFileDownloadUrl(initialStatusHistoryId, fileUrl)
      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error: any) {
      console.error('Failed to download file:', error)
      alert(error.message || 'Failed to download file')
    }
  }

  // Handler for downloading base files using the download endpoint
  const handleDownloadBaseFile = (fileUrl: string) => {
    // Use the backend download endpoint that sets Content-Disposition header
    const downloadUrl = getApiUrl(`v1/drawings/${drawingId}/files-from-base/download?fileUrl=${encodeURIComponent(fileUrl)}`)
    window.location.href = downloadUrl
  }

  // Handler for viewing base files (PDF/images)
  const handleViewBaseFile = (fileUrl: string, filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase()
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']

    if (extension === 'pdf') {
      setViewingBaseFile({ url: fileUrl, filename, type: 'pdf' })
    } else if (imageExtensions.includes(extension || '')) {
      setViewingBaseFile({ url: fileUrl, filename, type: 'image' })
    } else {
      // For other file types, just download
      handleDownloadBaseFile(fileUrl)
    }
  }

  // Handler for deleting files
  const handleDeleteFile = async () => {
    if (!fileToDelete) return

    setDeletingFileUrl(fileToDelete.url)
    try {
      await deleteFileFromAzure(fileToDelete.url)

      // Refetch the revision history detail to update the UI
      queryClient.invalidateQueries({
        queryKey: ['revisionHistoryDetail', initialStatusHistoryId],
      })
      queryClient.invalidateQueries({
        queryKey: ['drawingStatusHistory', drawingId],
      })

      setFileToDelete(null)
      alert('File deleted successfully')
    } catch (error: any) {
      console.error('Failed to delete file:', error)
      alert(error.message || 'Failed to delete file')
    } finally {
      setDeletingFileUrl(null)
    }
  }

  // Handler for deleting base files
  const handleDeleteBaseFile = async () => {
    if (!baseFileToDelete) return

    setDeletingBaseFileUrl(baseFileToDelete.url)
    try {
      await deleteFileFromAzure(baseFileToDelete.url)

      // Refetch base files to update the UI
      await refetchBaseFiles()

      setBaseFileToDelete(null)
      alert('File deleted successfully')
    } catch (error: any) {
      console.error('Failed to delete base file:', error)
      alert(error.message || 'Failed to delete base file')
    } finally {
      setDeletingBaseFileUrl(null)
    }
  }

  // Auto-show upload modal when drawing has no initial file
  useEffect(() => {
    if (drawing && !drawing.hasInitialFile && !showUploadModal) {
      setShowUploadModal(true)
    }
  }, [drawing])

  // Log fetched files for debugging (DO NOT auto-populate uploadedFiles)
  // Users must upload files manually for each status update
  useEffect(() => {
    if (showStatusModal && filesByType) {
      console.log('=== EXISTING FILES IN DATABASE (PROJECTS) ===')
      console.log('CAD Files:', filesByType.cadd)
      console.log('PDF Files:', filesByType.pdf)
      console.log('Note: These are used for validation only, not auto-loaded into upload state')
      console.log('==============================================')
    }
  }, [showStatusModal, filesByType])
  // Restore active upload sessions on mount
  useEffect(() => {
    const activeSessions = getActiveSessionsForPage('project', projectId, drawingId);

    if (activeSessions.length > 0) {
      // Restore the first active session as minimized upload
      const session = activeSessions[0];
      setMinimizedUploadData({
        progress: session.progress,
        uploadedChunks: session.uploadedChunks,
        totalChunks: session.totalChunks,
        isPaused: session.isPaused,
        filename: session.filename,
        sessionId: session.sessionId,
      });
      setIsUploadMinimized(true);
      setRestoredSessionId(session.sessionId);

      // Set the file context based on the session
      if (session.context?.fileContext) {
        setFileContext(session.context.fileContext as 'version' | 'file' | 'status-cadd' | 'status-pdf');
      }

      console.log('Restored upload session:', session.sessionId, session.filename);

      // Try to retrieve the file from IndexedDB and auto-resume if available
      getFile(session.sessionId)
        .then((storedFile) => {
          if (storedFile) {
            console.log('File retrieved from IndexedDB, upload can be resumed:', storedFile.name);
            // Set the selected file so modal can use it
            setSelectedFile(storedFile);

            // If upload was in progress (not paused), we could auto-resume here
            // For now, we leave it paused and let user resume manually via the indicator
            // To enable auto-resume, you would open the modal and call resumeUpload automatically
          } else {
            console.log('File not available in IndexedDB, upload cannot be resumed');
          }
        })
        .catch((error) => {
          console.error('Failed to retrieve file from IndexedDB:', error);
        });
    }
  }, [projectId, drawingId]);

  // Populate form when drawing data loads
  useEffect(() => {
    if (drawing && isEditing) {
      // Format plannedSubmissionDate to YYYY-MM-DD for date input
      let formattedDate = ''
      if (drawing.plannedSubmissionDate) {
        const date = new Date(drawing.plannedSubmissionDate)
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split('T')[0]
        }
      }

      setFormData({
        drawingName: drawing.drawingName || '',
        subSystemId: drawing.subSystem?.id || '',
        plannedSubmissionDate: formattedDate,
        drawingTypeId: drawing.drawingType?.id || '',
      })
    }
  }, [drawing, isEditing])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.drawingName.trim()) {
      newErrors.drawingName = 'Enter a drawing name.'
    } else if (formData.drawingName.trim().length < 2) {
      newErrors.drawingName = 'Drawing name must be at least 2 characters.'
    } else if (formData.drawingName.trim().length > 200) {
      newErrors.drawingName = 'Drawing name must not exceed 200 characters.'
    }

    if (!formData.subSystemId) {
      newErrors.subSystemId = 'Select a sub system.'
    }

    if (!formData.drawingTypeId) {
      newErrors.drawingTypeId = 'Select a drawing type.'
    }

    if (!formData.plannedSubmissionDate || formData.plannedSubmissionDate.trim() === '') {
      newErrors.plannedSubmissionDate = 'Select a planned submission date.'
    } else {
      // Check if it's a valid date (not just the placeholder dd/mm/yyyy)
      const dateValue = new Date(formData.plannedSubmissionDate)
      if (isNaN(dateValue.getTime())) {
        newErrors.plannedSubmissionDate = 'Enter a valid date.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const payload: UpdateDrawingData = {
      subSystemId: formData.subSystemId,
      drawingName: formData.drawingName.trim(),
      drawingTypeId: formData.drawingTypeId,
      plannedSubmissionDate: formData.plannedSubmissionDate,
    }

    try {
      await updateDrawingMutation.mutateAsync(payload)
      // Explicitly refetch drawing data to ensure page refreshes
      await refetchDrawing()
      setIsEditing(false)
    } catch (error: any) {
      if (error.fieldErrors) {
        setErrors(error.fieldErrors)
      } else {
        setErrors({ general: error.message || 'Failed to update drawing. Please try again.' })
      }
    }
  }

  const handleInitialFilesUpload = async (caddFiles: File[], pdfFiles: File[]) => {
    setIsUploadingInitialFiles(true)
    try {
      const formData = new FormData()

      // Append CADD files
      caddFiles.forEach(file => {
        formData.append('caddFiles', file)
      })

      // Append PDF files
      pdfFiles.forEach(file => {
        formData.append('pdfFiles', file)
      })

      // Upload files using the update endpoint with apiClient (handles CSRF automatically)
      const response = await apiClient(getApiUrl(`v1/drawings/${drawingId}`), {
        method: 'PUT',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload files')
      }

      // Invalidate all related queries to refresh the UI
      await queryClient.invalidateQueries({ queryKey: ['drawings', 'detail', drawingId] })
      await queryClient.invalidateQueries({ queryKey: ['drawings', 'status-history', drawingId] })
      await queryClient.invalidateQueries({ queryKey: ['drawings', 'files', drawingId] })
      await queryClient.invalidateQueries({ queryKey: ['revisionHistoryDetail'], exact: false })

      // Wait for status history to refetch so hasFiles flag is updated
      await queryClient.refetchQueries({ queryKey: ['drawings', 'status-history', drawingId] })

      // Close modal
      setShowUploadModal(false)
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload files')
    } finally {
      setIsUploadingInitialFiles(false)
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    if (!uploadData.pdfFile && !uploadData.caddFile) {
      newErrors.general = 'At least one file (PDF or CADD) is required.'
    }

    if (Object.keys(newErrors).length > 0) {
      setUploadErrors(newErrors)
      return
    }

    const payload: CreateFileVersionData = {
      ...(uploadData.pdfFile && { pdfFile: uploadData.pdfFile }),
      ...(uploadData.caddFile && { caddFile: uploadData.caddFile }),
    }

    try {
      await createFileVersionMutation.mutateAsync(payload)
      setShowUploadModal(false)
      setUploadData({ pdfFile: null, caddFile: null })
      setUploadErrors({})
    } catch (error: any) {
      if (error.fieldErrors) {
        setUploadErrors(error.fieldErrors)
      } else {
        setUploadErrors({ general: error.message || 'Failed to upload file version. Please try again.' })
      }
    }
  }

  // Handler to remove file from Azure Storage
  const handleRemoveFile = async (fileUrl: string, fileName: string) => {
    try {
      console.log(`[REMOVE FILE] Attempting to remove file: ${fileName}`);
      console.log(`[REMOVE FILE] File URL: ${fileUrl}`);

      // Call API to delete file from Azure
      // Backend automatically uses orgId as container from req.user.org_id
      const response = await apiClient(
        getApiUrl(`v1/drawings/revision-history/files/by-url?fileUrl=${encodeURIComponent(fileUrl)}`),
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[REMOVE FILE] Failed with status ${response.status}:`, errorText);
        throw new Error(`Failed to delete file: ${errorText}`);
      }

      console.log(`[REMOVE FILE] File ${fileName} removed successfully from Azure Storage`);
    } catch (error) {
      console.error('Failed to remove file:', error);
      throw error;
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    if (!statusData.status) {
      newErrors.status = 'Select a status.'
    }

    // Check if comment is required for specific statuses
    const statusesRequiringComment = ['Internal revision', 'Internal Approval', 'Revision ongoing', 'Approved']
    if (statusesRequiringComment.includes(statusData.status) && !statusData.comment.trim()) {
      newErrors.comment = 'Comment is required for this status.'
    }

    // Check if code is required for specific statuses
    const statusesRequiringCode = ['Revision ongoing', 'Approved']
    if (statusesRequiringCode.includes(statusData.status) && !statusData.codeId) {
      newErrors.codeId = 'Status code is required for this status.'
    }

    // File validation based on status
    if (statusData.status === 'Internal review') {
      // Internal review: CADD mandatory (single), PDF optional (multi)
      if (uploadedFiles.cadd.length === 0) {
        newErrors.caddFiles = 'At least one CADD file is required for Internal review status.'
      }
      // PDF files are optional for Internal review
    } else if (['Internal revision', 'Internal Approval', 'Revision ongoing', 'Approved'].includes(statusData.status)) {
      // These statuses: PDF optional (multi), CADD not required
      // No validation needed as PDF is optional
    }
    // Other statuses (Open, Designing, Submitted, On review): No files required

    if (Object.keys(newErrors).length > 0) {
      setStatusErrors(newErrors)
      return
    }

    // Files are already uploaded via resumable upload
    // Extract blob paths from Azure URLs (path starting from base container)
    const extractBlobPath = (url: string): string => {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        // Format: /container/blobPath -> return blobPath (everything after container)
        return pathParts.length >= 3 ? pathParts.slice(2).join('/') : url;
      } catch (error) {
        console.error('Failed to extract blob path from URL:', url, error);
        return url; // Return original URL as fallback
      }
    };

    try {
      // Step 1: If files were uploaded for "Internal review", create a file version first
      if (statusData.status === 'Internal review' && (uploadedFiles.cadd.length > 0 || uploadedFiles.pdf.length > 0)) {
        const fileVersionPayload: CreateFileVersionData = {
          ...(uploadedFiles.cadd.length > 0 && { caddUrl: uploadedFiles.cadd[0].url }),
          ...(uploadedFiles.pdf.length > 0 && { pdfUrl: uploadedFiles.pdf[0].url }),
        }
        await createFileVersionMutation.mutateAsync(fileVersionPayload)
      }

      // Step 2: Update the status with file URLs (blob paths)
      const statusPayload: any = {
        status: statusData.status,
        ...(statusData.comment && { comment: statusData.comment }),
        ...(statusData.codeId && { codeId: statusData.codeId }),
      };

      // Add file URLs if files were uploaded
      if (uploadedFiles.cadd.length > 0) {
        statusPayload.caddFileUrls = uploadedFiles.cadd.map(f => extractBlobPath(f.url));
        statusPayload.caddFileNames = uploadedFiles.cadd.map(f => f.name);
      }

      if (uploadedFiles.pdf.length > 0) {
        statusPayload.pdfFileUrls = uploadedFiles.pdf.map(f => extractBlobPath(f.url));
        statusPayload.pdfFileNames = uploadedFiles.pdf.map(f => f.name);
      }

      await updateStatusMutation.mutateAsync(statusPayload)

      setShowStatusModal(false)
      setStatusData({ status: '', comment: '', codeId: '', files: [], caddFiles: [], pdfFiles: [] })
      setUploadedFiles({ cadd: [], pdf: [] })
      setStatusErrors({})
    } catch (error: any) {
      if (error.fieldErrors) {
        setStatusErrors(error.fieldErrors)
      } else {
        setStatusErrors({ general: error.message || 'Failed to update status. Please try again.' })
      }
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="px-6">
          {/* Breadcrumb - Show different breadcrumb when navigated from tasks */}
          {fromTasks ? (
            <nav className="flex mb-4" aria-label="Breadcrumb" style={{ display: "none" }}>
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <span className="text-gray-500">Tasks</span>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="ml-1 text-gray-500 md:ml-2">Drawing Details</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="ml-1 text-gray-500 md:ml-2">{drawing?.drawingNumber || 'Loading...'}</span>
                  </div>
                </li>
              </ol>
            </nav>
          ) : (
            <nav className="flex mb-4" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <Link href="/projects" className="text-gray-700 hover:text-blue-600">
                    Projects
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <Link href={`/projects/${projectId}`} className="ml-1 text-gray-700 hover:text-blue-600 md:ml-2">
                      Project Details
                    </Link>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="ml-1 text-gray-500 md:ml-2">{drawing?.drawingNumber || 'Loading...'}</span>
                  </div>
                </li>
              </ol>
            </nav>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-sm text-blue-800">Loading drawing details...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading drawing</h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error?.message || 'Failed to load drawing details. Please try again.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && drawing && (
            <>
              {/* Header */}
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">{drawing.drawingName}</h1>
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {drawing.status}
                      </span>
                      {statusHistory && statusHistory.length > 0 && statusHistory[0].revisionVersion && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          v{statusHistory[0].revisionVersion}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{drawing.drawingNumber}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (isEditing) {
                          setIsEditing(false)
                        } else {
                          router.push(fromTasks && taskId ? `/tasks/${taskId}` : `/projects/${projectId}`)
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      {isEditing ? 'Back to Drawing' : (fromTasks ? 'Back to Task' : 'Back to Project')}
                    </button>
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => setShowStatusModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-purple-600 rounded-md shadow-sm text-sm font-medium text-purple-600 bg-white hover:bg-purple-50"
                        >
                          Update Status
                        </button>
                        {/* <button
                          onClick={() => setShowUploadModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-green-600 rounded-md shadow-sm text-sm font-medium text-green-600 bg-white hover:bg-green-50"
                        >
                          Upload Version
                        </button> */}
                        {!fromTasks && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Edit Drawing
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Mode */}
              {isEditing ? (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Edit Drawing</h2>

                  {/* Global Error */}
                  {errors.general && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{errors.general}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Drawing Name */}
                    <div>
                      <label htmlFor="drawingName" className="block text-sm font-medium text-gray-700 mb-1">
                        Drawing Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="drawingName"
                        name="drawingName"
                        value={formData.drawingName}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.drawingName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        disabled={updateDrawingMutation.isPending}
                      />
                      {errors.drawingName && (
                        <p className="mt-1 text-sm text-red-600">{errors.drawingName}</p>
                      )}
                    </div>

                    {/* Sub System */}
                    <div>
                      <label htmlFor="subSystemId" className="block text-sm font-medium text-gray-700 mb-1">
                        Sub System <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="subSystemId"
                        name="subSystemId"
                        value={formData.subSystemId}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.subSystemId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        disabled={updateDrawingMutation.isPending}
                      >
                        <option value="">Select Sub System</option>
                        {subSystems?.map((subSystem) => (
                          <option key={subSystem.id} value={subSystem.id}>
                            {subSystem.name} ({subSystem.code})
                          </option>
                        ))}
                      </select>
                      {errors.subSystemId && (
                        <p className="mt-1 text-sm text-red-600">{errors.subSystemId}</p>
                      )}
                    </div>

                    {/* Drawing Type */}
                    <div>
                      <label htmlFor="drawingTypeId" className="block text-sm font-medium text-gray-700 mb-1">
                        Drawing Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="drawingTypeId"
                        name="drawingTypeId"
                        value={formData.drawingTypeId}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.drawingTypeId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        disabled={updateDrawingMutation.isPending}
                      >
                        <option value="">Select Drawing Type</option>
                        {drawingTypes?.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      {errors.drawingTypeId && (
                        <p className="mt-1 text-sm text-red-600">{errors.drawingTypeId}</p>
                      )}
                    </div>

                    {/* Planned Submission Date */}
                    <div>
                      <label htmlFor="plannedSubmissionDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Planned Submission Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="plannedSubmissionDate"
                        name="plannedSubmissionDate"
                        value={formData.plannedSubmissionDate}
                        onChange={handleChange}
                        required
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.plannedSubmissionDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        disabled={updateDrawingMutation.isPending}
                      />
                      {errors.plannedSubmissionDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.plannedSubmissionDate}</p>
                      )}
                    </div>

                    {/* Current Files Section */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <h3 className="text-base font-medium text-gray-900 mb-4">Current Files</h3>
                      {(() => {
                        // Helper function to safely parse URLs (handles both single string and JSON array)
                        const parseUrls = (urlData: string | null | undefined): string[] => {
                          if (!urlData) return []
                          try {
                            const parsed = JSON.parse(urlData)
                            return Array.isArray(parsed) ? parsed : [parsed]
                          } catch {
                            // It's a single URL string, not JSON
                            return [urlData]
                          }
                        }

                        // Helper function to safely parse filenames
                        const parseFilenames = (filenameData: string | null | undefined): string[] => {
                          if (!filenameData) return []
                          try {
                            const parsed = JSON.parse(filenameData)
                            return Array.isArray(parsed) ? parsed : [parsed]
                          } catch {
                            // It's a single filename string, not JSON
                            return [filenameData]
                          }
                        }

                        // Show ONLY initial files (version 0.0 with Open status)
                        // Do NOT show recent files or file versions here
                        const hasRevisionFiles = initialOpenStatus && initialRevisionDetail?.revision_file

                        if (hasRevisionFiles) {
                          // Show ONLY initial files (version 0.0 with Open status)
                          return (
                            <div className="space-y-3 mb-6">
                              <div className="bg-white border border-gray-300 rounded-md p-4">
                                <div className="space-y-2">
                                  {/* CADD Files */}
                                  {initialRevisionDetail?.revision_file?.cadd_url && (() => {
                                    const caddUrls = parseUrls(initialRevisionDetail.revision_file.cadd_url)
                                    const caddFilenames = parseFilenames(initialRevisionDetail.revision_file.cadd_original_filename)

                                    return caddUrls.map((url: string, index: number) => (
                                      <div key={`cadd-${index}`} className="flex items-center text-sm">
                                        <svg className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="text-gray-700 font-medium">CADD:</span>
                                        <span className="ml-2 text-gray-600">{caddFilenames[index] || `File ${index + 1}`}</span>
                                      </div>
                                    ))
                                  })()}

                                  {/* PDF Files */}
                                  {initialRevisionDetail?.revision_file?.pdf_url && (() => {
                                    const pdfUrls = parseUrls(initialRevisionDetail.revision_file.pdf_url)
                                    const pdfFilenames = parseFilenames(initialRevisionDetail.revision_file.pdf_original_filename)

                                    return pdfUrls.map((url: string, index: number) => (
                                      <div key={`pdf-${index}`} className="flex items-center text-sm">
                                        <svg className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-gray-700 font-medium">PDF:</span>
                                        <span className="ml-2 text-gray-600">{pdfFilenames[index] || `File ${index + 1}`}</span>
                                      </div>
                                    ))
                                  })()}
                                </div>
                                {/* <p className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                              You can view these files in the <strong>Revision History</strong> tab or upload new files below to replace them.
                            </p> */}
                              </div>
                            </div>
                          )
                        } else {
                          // No initial files found - show "No files" message
                          // No files
                          return (
                            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
                              <p className="text-sm text-gray-600">
                                No files uploaded yet for this drawing.
                              </p>
                            </div>
                          )
                        }
                      })()}
                    </div>

                    {/* File Replacement Section */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <h3 className="text-base font-medium text-gray-900 mb-4">Upload(Replace) Files</h3>

                      {/* Base CAD Files Upload */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Base CAD Files <span className="text-gray-500">(Optional)</span>
                        </label>
                        <InlineFileUpload
                          entityType="project"
                          entityId={projectId}
                          fileContext="base-cad"
                          bidCode={project?.projectNumber}
                          drawingCode={drawing?.drawingNumber}
                          onUploadComplete={() => {
                            // Refetch base files to display newly uploaded files
                            refetchBaseFiles()
                          }}
                          acceptedFileTypes=".dwg,.dxf,.rvt,.rfa,.nwd,.nwc"
                          maxFiles={10}
                        />
                      </div>

                      {/* Base PDF Files Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Base PDF Files <span className="text-gray-500">(Optional)</span>
                        </label>
                        <InlineFileUpload
                          entityType="project"
                          entityId={projectId}
                          fileContext="base-pdf"
                          bidCode={project?.projectNumber}
                          drawingCode={drawing?.drawingNumber}
                          onUploadComplete={() => {
                            // Refetch base files to display newly uploaded files
                            refetchBaseFiles()
                          }}
                          acceptedFileTypes=".pdf,application/pdf"
                          maxFiles={10}
                        />
                      </div>

                      {/* Display Uploaded Base Files */}
                      {baseFiles && (baseFiles.cadd.length > 0 || baseFiles.pdf.length > 0) && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-900 mb-4">Uploaded Base Files</h4>

                          {/* Base CAD Files */}
                          {baseFiles.cadd.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs font-medium text-gray-700 mb-2">CAD Files ({baseFiles.cadd.length})</p>
                              <div className="space-y-2">
                                {baseFiles.cadd.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                                    <div className="flex items-center gap-3">
                                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                      </svg>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleDownloadBaseFile(file.url)}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                      >
                                        Download
                                      </button>
                                      <button
                                        onClick={() => setBaseFileToDelete({ url: file.url, filename: file.name })}
                                        disabled={deletingBaseFileUrl === file.url}
                                        className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                                      >
                                        {deletingBaseFileUrl === file.url ? 'Deleting...' : 'Delete'}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Base PDF Files */}
                          {baseFiles.pdf.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-2">PDF Files ({baseFiles.pdf.length})</p>
                              <div className="space-y-2">
                                {baseFiles.pdf.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                                    <div className="flex items-center gap-3">
                                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                      </svg>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleViewBaseFile(file.viewUrl || file.url, file.name)}
                                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                                      >
                                        View
                                      </button>
                                      <button
                                        onClick={() => handleDownloadBaseFile(file.url)}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                      >
                                        Download
                                      </button>
                                      <button
                                        onClick={() => setBaseFileToDelete({ url: file.url, filename: file.name })}
                                        disabled={deletingBaseFileUrl === file.url}
                                        className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                                      >
                                        {deletingBaseFileUrl === file.url ? 'Deleting...' : 'Delete'}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false)
                          setErrors({})
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        disabled={updateDrawingMutation.isPending}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        disabled={updateDrawingMutation.isPending}
                      >
                        {updateDrawingMutation.isPending && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {updateDrawingMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* View Mode with Tabs */
                <div className="bg-white shadow rounded-lg">
                  {/* Tabs */}
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex">
                      <button
                        onClick={() => setActiveTab('details')}
                        className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'details'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                      >
                        Details
                      </button>
                      {/* <button
                        onClick={() => setActiveTab('versions')}
                        className={`py-4 px-6 text-sm font-medium border-b-2 ${
                          activeTab === 'versions'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        File Versions {drawing.fileVersions && drawing.fileVersions.length > 0 && `(${drawing.fileVersions.length})`}
                      </button> */}
                      {/* <button
                        onClick={() => setActiveTab('files')}
                        className={`py-4 px-6 text-sm font-medium border-b-2 ${
                          activeTab === 'files'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Files {filesData && filesData.total > 0 && `(${filesData.total})`}
                      </button> */}
                      <button
                        onClick={() => setActiveTab('history')}
                        className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'history'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                      >
                        Status History
                      </button>
                      <button
                        onClick={() => setActiveTab('revisions')}
                        className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === 'revisions'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                      >
                        Revision History
                      </button>
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
                    {activeTab === 'details' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Drawing Information */}
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Drawing Information</h3>
                            <dl className="space-y-3">
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Drawing Number</dt>
                                <dd className="mt-1 text-sm text-gray-900">{drawing.drawingNumber}</dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Drawing Name</dt>
                                <dd className="mt-1 text-sm text-gray-900">{drawing.drawingName}</dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Sub System</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                  {drawing.subSystem
                                    ? `${drawing.subSystem.name} (${drawing.subSystem.code})`
                                    : 'N/A'}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Drawing Type</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                  {drawing.drawingType?.name || 'N/A'}
                                </dd>
                              </div>
                            </dl>
                          </div>

                          {/* Submission Information */}
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Submission Information</h3>
                            <dl className="space-y-3">
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Submission Number</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                  {drawing.submissionNumber || 'N/A'}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Planned Submission Date</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                  {drawing.plannedSubmissionDate
                                    ? new Date(drawing.plannedSubmissionDate).toLocaleDateString()
                                    : 'N/A'}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    {drawing.status}
                                  </span>
                                </dd>
                              </div>
                              <div>
                                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                  {drawing.creator?.fullName || 'N/A'}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Created At</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {new Date(drawing.createdAt).toLocaleString()}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {new Date(drawing.updatedAt).toLocaleString()}
                              </dd>
                            </div>
                          </dl>
                        </div>

                        {/* Files Section */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Files</h3>
                          {(() => {
                            // Helper function to safely parse URLs (handles both single string and JSON array)
                            const parseUrls = (urlData: string | null | undefined): string[] => {
                              if (!urlData) return []
                              try {
                                const parsed = JSON.parse(urlData)
                                return Array.isArray(parsed) ? parsed : [parsed]
                              } catch {
                                // It's a single URL string, not JSON
                                return [urlData]
                              }
                            }

                            // Helper function to safely parse filenames
                            const parseFilenames = (filenameData: string | null | undefined): string[] => {
                              if (!filenameData) return []
                              try {
                                const parsed = JSON.parse(filenameData)
                                return Array.isArray(parsed) ? parsed : [parsed]
                              } catch {
                                // It's a single filename string, not JSON
                                return [filenameData]
                              }
                            }

                            // Show BOTH revision files AND Base files (if available)
                            const hasRevisionFiles = initialOpenStatus && initialRevisionDetail?.revision_file
                            const hasBaseFiles = baseFiles && (baseFiles.cadd.length > 0 || baseFiles.pdf.length > 0)

                            // If neither type of files exists, show empty state
                            if (!hasRevisionFiles && !hasBaseFiles) {
                              return (
                                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                                  <p className="text-sm text-gray-600">
                                    No files uploaded yet.
                                  </p>
                                </div>
                              )
                            }

                            return (
                              <>
                            {hasRevisionFiles && (
                                <div className="space-y-3">
                                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                      {/* CADD Files */}
                                      {initialRevisionDetail?.revision_file?.cadd_url && (() => {
                                        const caddUrls = parseUrls(initialRevisionDetail.revision_file.cadd_url)
                                        const caddFilenames = parseFilenames(initialRevisionDetail.revision_file.cadd_original_filename)

                                        return caddUrls.map((url: string, index: number) => (
                                            <div key={`cadd-${index}`} className="flex flex-col text-sm p-3 border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors">
                                              <div className="flex items-center mb-2">
                                                <svg className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span className="text-gray-700 font-medium truncate" title={caddFilenames[index] || `File ${index + 1}`}>
                                                  {caddFilenames[index] || `File ${index + 1}`}
                                                </span>
                                              </div>
                                              <div className="text-gray-600 text-xs mb-3">
                                                CADD
                                              </div>
                                              <div className="flex items-center gap-2 justify-end mt-auto">
                                                <button
                                                  onClick={() => handleViewCaddFile(
                                                    url,
                                                    caddFilenames[index] || `File ${index + 1}`,
                                                    initialRevisionDetail.changed_by?.full_name,
                                                    new Date(initialRevisionDetail.changed_at).toLocaleString()
                                                  )}
                                                  className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50"
                                                  title="View"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                  </svg>
                                                </button>
                                                <button
                                                  onClick={() => handleDownloadFile(url, caddFilenames[index] || `File ${index + 1}`)}
                                                  className="text-green-600 hover:text-green-800 p-1.5 rounded hover:bg-green-50"
                                                  title="Download"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                  </svg>
                                                </button>
                                                <button
                                                  onClick={() => setFileToDelete({ url, filename: caddFilenames[index] || `File ${index + 1}` })}
                                                  disabled={deletingFileUrl === url}
                                                  className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50 disabled:opacity-50"
                                                  title="Delete"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                  </svg>
                                                </button>
                                              </div>
                                            </div>
                                          ))
                                      })()}

                                      {/* PDF Files */}
                                      {initialRevisionDetail?.revision_file?.pdf_url && (() => {
                                        const pdfUrls = parseUrls(initialRevisionDetail.revision_file.pdf_url)
                                        const pdfFilenames = parseFilenames(initialRevisionDetail.revision_file.pdf_original_filename)

                                        return pdfUrls.map((url: string, index: number) => (
                                            <div key={`pdf-${index}`} className="flex flex-col text-sm p-3 border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors">
                                              <div className="flex items-center mb-2">
                                                <svg className="h-6 w-6 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-gray-700 font-medium truncate" title={pdfFilenames[index] || `File ${index + 1}`}>
                                                  {pdfFilenames[index] || `File ${index + 1}`}
                                                </span>
                                              </div>
                                              <div className="text-gray-600 text-xs mb-3">
                                                PDF
                                              </div>
                                              <div className="flex items-center gap-2 justify-end mt-auto">
                                                <button
                                                  onClick={async () => {
                                                    try {
                                                      const { downloadUrl } = await generateFileDownloadUrl(initialStatusHistoryId, url)
                                                      setPdfViewerData({
                                                        url: downloadUrl,
                                                        filename: pdfFilenames[index] || `File ${index + 1}`,
                                                        uploadedBy: initialRevisionDetail.changed_by?.full_name,
                                                        uploadedAt: new Date(initialRevisionDetail.changed_at).toLocaleString()
                                                      })
                                                    } catch (error: any) {
                                                      console.error('Failed to load PDF:', error)
                                                      alert(error.message || 'Failed to load PDF')
                                                    }
                                                  }}
                                                  className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50"
                                                  title="View"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                  </svg>
                                                </button>
                                                <button
                                                  onClick={() => handleDownloadFile(url, pdfFilenames[index] || `File ${index + 1}`)}
                                                  className="text-green-600 hover:text-green-800 p-1.5 rounded hover:bg-green-50"
                                                  title="Download"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                  </svg>
                                                </button>
                                                <button
                                                  onClick={() => setFileToDelete({ url, filename: pdfFilenames[index] || `File ${index + 1}` })}
                                                  disabled={deletingFileUrl === url}
                                                  className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50 disabled:opacity-50"
                                                  title="Delete"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                  </svg>
                                                </button>
                                              </div>
                                            </div>
                                          ))
                                      })()}
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    Files uploaded on {new Date(initialRevisionDetail.changed_at).toLocaleString()}
                                  </p>
                                </div>
                            )}

                                {/* Base Files Section */}
                                {hasBaseFiles && (
                                  <div className="space-y-3">
                                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                                      <h4 className="text-sm font-medium text-gray-700 mb-3">Base Files</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                        {/* Base CAD Files */}
                                        {baseFiles.cadd.map((file, index) => (
                                          <div key={`base-cadd-${index}`} className="flex flex-col text-sm p-3 border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors">
                                            <div className="flex items-center mb-2">
                                              <svg className="h-6 w-6 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                              </svg>
                                              <span className="text-gray-700 font-medium truncate" title={file.name}>
                                                {file.name}
                                              </span>
                                            </div>
                                            <div className="text-gray-600 text-xs mb-3">
                                              CAD • {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </div>
                                            <div className="flex items-center gap-2 justify-end mt-auto">
                                              <button
                                                onClick={() => handleDownloadBaseFile(file.url)}
                                                className="text-green-600 hover:text-green-800 p-1.5 rounded hover:bg-green-50"
                                                title="Download"
                                              >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                              </button>
                                            </div>
                                          </div>
                                        ))}

                                        {/* Base PDF Files */}
                                        {baseFiles.pdf.map((file, index) => (
                                          <div key={`base-pdf-${index}`} className="flex flex-col text-sm p-3 border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors">
                                            <div className="flex items-center mb-2">
                                              <svg className="h-6 w-6 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                              </svg>
                                              <span className="text-gray-700 font-medium truncate" title={file.name}>
                                                {file.name}
                                              </span>
                                            </div>
                                            <div className="text-gray-600 text-xs mb-3">
                                              PDF • {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </div>
                                            <div className="flex items-center gap-2 justify-end mt-auto">
                                              <button
                                                onClick={() => handleViewBasePdfFile(file.url, file.name)}
                                                className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50"
                                                title="View"
                                              >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                              </button>
                                              <button
                                                onClick={() => handleDownloadBaseFile(file.url)}
                                                className="text-green-600 hover:text-green-800 p-1.5 rounded hover:bg-green-50"
                                                title="Download"
                                              >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      </>
                    )}

                    {activeTab === 'versions' && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-gray-900">File Versions</h3>
                          <button
                            onClick={() => setShowUploadModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Upload New Version
                          </button>
                        </div>
                        {drawing.fileVersions && drawing.fileVersions.length > 0 ? (
                          <div className="space-y-3">
                            {drawing.fileVersions
                              .sort((a, b) => b.version - a.version)
                              .map((version) => (
                                <div
                                  key={version.id}
                                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h4 className="text-base font-semibold text-gray-900">
                                          Version {version.version}
                                        </h4>
                                        {drawing.fileVersions && version.version === Math.max(...drawing.fileVersions.map(v => v.version)) && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            Latest
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-600 space-y-1">
                                        <p>
                                          <span className="font-medium">Uploaded by:</span>{' '}
                                          {version.uploadedBy?.fullName || 'Unknown'}
                                        </p>
                                        <p>
                                          <span className="font-medium">Date:</span>{' '}
                                          {new Date(version.uploadedAt).toLocaleString()}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                          {version.pdfUrl && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path
                                                  fillRule="evenodd"
                                                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                                  clipRule="evenodd"
                                                />
                                              </svg>
                                              PDF
                                            </span>
                                          )}
                                          {version.caddUrl && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path
                                                  fillRule="evenodd"
                                                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                                  clipRule="evenodd"
                                                />
                                              </svg>
                                              CADD
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-2 ml-4">
                                      {version.pdfUrl && (
                                        <a
                                          href={version.pdfUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                                        >
                                          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                          </svg>
                                          View PDF
                                        </a>
                                      )}
                                      {version.caddUrl && (
                                        <a
                                          href={version.caddUrl}
                                          download
                                          className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                                        >
                                          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                            />
                                          </svg>
                                          Download CADD
                                        </a>
                                      )}
                                      <button
                                        onClick={async () => {
                                          if (confirm(`Delete version ${version.version}? This action cannot be undone.`)) {
                                            try {
                                              await deleteFileVersionMutation.mutateAsync(version.id)
                                              alert('Version deleted successfully')
                                            } catch (error: any) {
                                              alert(error.message || 'Failed to delete version')
                                            }
                                          }
                                        }}
                                        disabled={deleteFileVersionMutation.isPending}
                                        className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                          />
                                        </svg>
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <h3 className="mt-4 text-sm font-medium text-gray-900">No file versions uploaded</h3>
                            <p className="mt-2 text-sm text-gray-500">
                              Get started by uploading your first file version.
                            </p>
                            <button
                              onClick={() => setShowUploadModal(true)}
                              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                              Upload New Version
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'files' && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-gray-900">Uploaded Files</h3>
                          <div className="flex gap-2">
                            {selectedFiles.length > 0 && (
                              <button
                                onClick={async () => {
                                  if (confirm(`Delete ${selectedFiles.length} selected file(s)?`)) {
                                    try {
                                      await bulkDeleteMutation.mutateAsync(selectedFiles)
                                      setSelectedFiles([])
                                    } catch (error: any) {
                                      alert(error.message || 'Failed to delete files')
                                    }
                                  }
                                }}
                                className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                                disabled={bulkDeleteMutation.isPending}
                              >
                                Delete Selected ({selectedFiles.length})
                              </button>
                            )}
                            <button
                              onClick={() => setShowFileUploadModal(true)}
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                              Upload File
                            </button>
                          </div>
                        </div>

                        {filesData && filesData.data.length > 0 ? (
                          <>
                            <div className="space-y-3">
                              {filesData.data.map((file) => (
                                <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                      {/* <input
                                        type="checkbox"
                                        checked={selectedFiles.includes(file.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedFiles([...selectedFiles, file.id])
                                          } else {
                                            setSelectedFiles(selectedFiles.filter((id) => id !== file.id))
                                          }
                                        }}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                      /> */}
                                      <svg
                                        className="h-8 w-8 text-red-500"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{file.filename}</p>
                                        <p className="text-xs text-gray-500">
                                          Uploaded by {file.uploadedBy.fullName} on{' '}
                                          {new Date(file.uploadedAt).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <a
                                        href={file.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                      >
                                        Preview
                                      </a>
                                      <a
                                        href={file.fileUrl}
                                        download
                                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100"
                                      >
                                        Download
                                      </a>
                                      <button
                                        onClick={async () => {
                                          if (confirm('Delete this file?')) {
                                            try {
                                              await deleteFileMutation.mutateAsync(file.id)
                                            } catch (error: any) {
                                              alert(error.message || 'Failed to delete file')
                                            }
                                          }
                                        }}
                                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                                        disabled={deleteFileMutation.isPending}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Pagination */}
                            {filesData.totalPages > 1 && (
                              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                                <div className="flex items-center gap-2">
                                  <label className="text-sm text-gray-700">Per page:</label>
                                  <select
                                    value={filesPageSize}
                                    onChange={(e) => {
                                      setFilesPageSize(Number(e.target.value))
                                      setFilesPage(1)
                                    }}
                                    className="border border-gray-300 rounded-md text-sm px-2 py-1"
                                  >
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                  </select>
                                  <span className="text-sm text-gray-700">
                                    Showing {(filesPage - 1) * filesPageSize + 1} to{' '}
                                    {Math.min(filesPage * filesPageSize, filesData.total)} of {filesData.total}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setFilesPage(filesPage - 1)}
                                    disabled={filesPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Previous
                                  </button>
                                  <button
                                    onClick={() => setFilesPage(filesPage + 1)}
                                    disabled={filesPage === filesData.totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Next
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Upload PDF files to get started.
                            </p>
                            <button
                              onClick={() => setShowFileUploadModal(true)}
                              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                              Upload First File
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'history' && (
                      <StatusHistoryPanel
                        statusHistory={statusHistory || []}
                        drawingNumber={drawing.drawingNumber}
                        drawingName={drawing.drawingName}
                        entityType="project"
                        entityId={projectId}
                        drawingId={drawingId}
                      />
                    )}

                    {activeTab === 'revisions' && (
                      <RevisionHistoryPanel
                        statusHistory={statusHistory || []}
                        drawingNumber={drawing.drawingNumber}
                        drawingName={drawing.drawingName}
                        entityType="project"
                        entityId={projectId}
                        drawingId={drawingId}
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Upload File Version Modal */}
      {showUploadModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowUploadModal(false)}
          ></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload File Version</h3>

              {uploadErrors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{uploadErrors.general}</p>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label htmlFor="pdfFile" className="block text-sm font-medium text-gray-700 mb-1">
                    PDF File
                  </label>
                  <input
                    type="file"
                    id="pdfFile"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setSelectedFile(file)
                        setFileContext('version')
                        setShowResumableModal(true)
                        setShowUploadModal(false)
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={createFileVersionMutation.isPending}
                  />
                  {uploadData.pdfFile && (
                    <p className="text-xs text-gray-600 mt-1">
                      Selected: {uploadData.pdfFile.name} ({(uploadData.pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="caddFile" className="block text-sm font-medium text-gray-700 mb-1">
                    CADD File
                  </label>
                  <input
                    type="file"
                    id="caddFile"
                    accept=".dwg,.dxf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setSelectedFile(file)
                        setFileContext('version')
                        setShowResumableModal(true)
                        setShowUploadModal(false)
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={createFileVersionMutation.isPending}
                  />
                  {uploadData.caddFile && (
                    <p className="text-xs text-gray-600 mt-1">
                      Selected: {uploadData.caddFile.name} ({(uploadData.caddFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <p className="text-xs text-gray-500">At least one file is required. All files use resumable upload with progress tracking.</p>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={createFileVersionMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    disabled={createFileVersionMutation.isPending}
                  >
                    {createFileVersionMutation.isPending && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {createFileVersionMutation.isPending ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Upload Drawing File Modal */}
      {showFileUploadModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowFileUploadModal(false)}
          ></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload File</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload a PDF file. All files use resumable upload with progress tracking.
              </p>

              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const fileInput = document.getElementById('drawingFileInput') as HTMLInputElement
                  if (!fileInput?.files?.[0]) {
                    alert('Please select a file')
                    return
                  }

                  const file = fileInput.files[0]

                  // Always use resumable upload for all files
                  setSelectedFile(file)
                  setFileContext('file')
                  setShowResumableModal(true)
                  setShowFileUploadModal(false)
                  fileInput.value = ''
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="drawingFileInput" className="block text-sm font-medium text-gray-700 mb-2">
                    Select PDF File <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    id="drawingFileInput"
                    accept=".pdf,application/pdf"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={uploadFileMutation.isPending}
                  />
                  <p className="mt-1 text-xs text-gray-500">PDF files only. All files use resumable upload.</p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowFileUploadModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={uploadFileMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    disabled={uploadFileMutation.isPending}
                  >
                    {uploadFileMutation.isPending && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {uploadFileMutation.isPending ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Update Status Modal */}
      {showStatusModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => {
              setShowStatusModal(false)
              setUploadedFiles({ cadd: [], pdf: [] })
            }}
          ></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Drawing Status</h3>

              {statusErrors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{statusErrors.general}</p>
                </div>
              )}

              <form onSubmit={handleStatusSubmit} className="space-y-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="status"
                    value={statusData.status}
                    onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusErrors.status ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    disabled={updateStatusMutation.isPending}
                  >
                    <option value="">Select Status</option>
                    {user?.role === 'Draftsman' ? (
                      <>
                        <option value="Designing">Designing</option>
                        <option value="Internal review">Internal review</option>
                      </>
                    ) : (
                      <>
                        <option value="Open">Open</option>
                        <option value="Designing">Designing</option>
                        <option value="Internal review">Internal review</option>
                        <option value="Internal revision">Internal revision</option>
                        <option value="Internal Approval">Internal Approval</option>
                        <option value="Submitted">Submitted</option>
                        <option value="On review">On review</option>
                        <option value="Revision ongoing">Revision ongoing</option>
                        <option value="Approved">Approved</option>
                      </>
                    )}
                  </select>
                  {statusErrors.status && (
                    <p className="mt-1 text-sm text-red-600">{statusErrors.status}</p>
                  )}
                </div>

                {['Internal revision', 'Internal Approval', 'Revision ongoing', 'Approved'].includes(statusData.status) && (
                  <>
                    <div>
                      <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                        Comment <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="comment"
                        value={statusData.comment}
                        onChange={(e) => setStatusData({ ...statusData, comment: e.target.value })}
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusErrors.comment ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder="Enter comment..."
                        disabled={updateStatusMutation.isPending}
                      />
                      {statusErrors.comment && (
                        <p className="mt-1 text-sm text-red-600">{statusErrors.comment}</p>
                      )}
                    </div>

                    {['Revision ongoing', 'Approved'].includes(statusData.status) && (
                      <div>
                        <label htmlFor="codeId" className="block text-sm font-medium text-gray-700 mb-1">
                          Status Code <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="codeId"
                          value={statusData.codeId}
                          onChange={(e) => setStatusData({ ...statusData, codeId: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusErrors.codeId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                          disabled={updateStatusMutation.isPending}
                        >
                          <option value="">Select Code</option>
                          {statusCodes?.filter((code) => {
                            // Filter codes based on status
                            // Revision ongoing: Show CODE B, CODE C, CODE D only (exclude CODE A)
                            if (statusData.status === 'Revision ongoing') {
                              return code.code !== 'Code A'
                            }
                            // Approved: Show CODE A and CODE B only (exclude CODE C, CODE D)
                            if (statusData.status === 'Approved') {
                              return code.code === 'Code A' || code.code === 'Code B'
                            }
                            // For other statuses, show all codes
                            return true
                          }).map((code) => (
                            <option key={code.id} value={code.id}>
                              {code.code} - {code.description}
                            </option>
                          ))}
                        </select>
                        {statusErrors.codeId && (
                          <p className="mt-1 text-sm text-red-600">{statusErrors.codeId}</p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* File Upload for all statuses that require files - Inline Upload Components */}
                {['Internal review', 'Internal revision', 'Internal Approval', 'Revision ongoing', 'Approved'].includes(statusData.status) && (
                  <div className="space-y-4">
                    {/* CADD Files - Only for Internal review */}
                    {statusData.status === 'Internal review' && (
                      <div>
                        <label htmlFor="caddFiles" className="block text-sm font-medium text-gray-700 mb-2">
                          CADD Files <span className="text-red-500">*</span>
                        </label>
                      <InlineFileUpload
                        entityType="project"
                        entityId={projectId}
                        drawingId={drawingId}
                        fileContext="status-cadd"
                        bidCode={project?.projectNumber}
                        drawingCode={drawing?.drawingNumber}
                        drawingStatus={statusData.status as any}
                        currentVersion={currentVersion}
                        revisionVersion={revisionVersion}
                        acceptedFileTypes=".dwg,.dxf"
                        maxFiles={1}
                        fileTypeLabel="CAD"
                        fileTypeHint="DWG, DXF files only"
                        hasError={!!statusErrors.caddFiles}
                        disabled={updateStatusMutation.isPending}
                        onExistingFilesDetected={(files) => {
                          // Populate uploadedFiles with existing files from database
                          setUploadedFiles(prev => ({
                            ...prev,
                            cadd: files
                          }))
                          // Clear validation error when existing files are detected
                          setStatusErrors(prev => {
                            const { caddFiles, ...rest } = prev
                            return rest
                          })
                        }}
                        onUploadComplete={(results) => {
                          setUploadedFiles(prev => ({
                            ...prev,
                            cadd: results.map(r => ({
                              name: r.filename,
                              url: r.fileUrl,
                              size: 0
                            }))
                          }))
                          // Clear CADD file error when files are uploaded
                          setStatusErrors(prev => {
                            const { caddFiles, ...rest } = prev
                            return rest
                          })
                        }}
                        onFileRemove={handleRemoveFile}
                      />
                      {statusErrors.caddFiles && (
                        <p className="mt-1 text-sm text-red-600">{statusErrors.caddFiles}</p>
                      )}

                      {/* Display uploaded CADD files */}
                      {uploadedFiles.cadd.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {uploadedFiles.cadd.map((file, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
                                  </svg>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                    <p className="text-xs text-green-600">✓ Uploaded</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadedFiles(prev => ({
                                      ...prev,
                                      cadd: prev.cadd.filter((_, i) => i !== index)
                                    }))
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    )}

                    {/* Other Files - For Internal review, Internal revision, Internal Approval, Revision ongoing, Approved */}
                    {['Internal review', 'Internal revision', 'Internal Approval', 'Revision ongoing', 'Approved'].includes(statusData.status) && (
                      <div>
                      <label htmlFor="otherFiles" className="block text-sm font-medium text-gray-700 mb-2">
                        Other Files <span className="text-gray-500">(Optional)</span>
                      </label>
                      <InlineFileUpload
                        entityType="project"
                        entityId={projectId}
                        drawingId={drawingId}
                        fileContext="status-pdf"
                        bidCode={project?.projectNumber}
                        drawingCode={drawing?.drawingNumber}
                        drawingStatus={statusData.status as any}
                        currentVersion={currentVersion}
                        revisionVersion={revisionVersion}
                        acceptedFileTypes="*"
                        maxFiles={1}
                        fileTypeLabel="Other"
                        fileTypeHint="All file formats allowed"
                        hasError={!!statusErrors.pdfFiles}
                        disabled={updateStatusMutation.isPending}
                        onUploadComplete={(results) => {
                          setUploadedFiles(prev => ({
                            ...prev,
                            pdf: results.map(r => ({
                              name: r.filename,
                              url: r.fileUrl,
                              size: 0
                            }))
                          }))
                          // Clear error if any
                          const { pdfFiles: _, ...restErrors} = statusErrors
                          setStatusErrors(restErrors)
                        }}
                        onFileRemove={handleRemoveFile}
                      />
                      {statusErrors.pdfFiles && (
                        <p className="mt-1 text-sm text-red-600">{statusErrors.pdfFiles}</p>
                      )}

                      {/* Display uploaded PDF files */}
                      {uploadedFiles.pdf.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {uploadedFiles.pdf.map((file, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
                                  </svg>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                    <p className="text-xs text-green-600">✓ Uploaded</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadedFiles(prev => ({
                                      ...prev,
                                      pdf: prev.pdf.filter((_, i) => i !== index)
                                    }))
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStatusModal(false)
                      setUploadedFiles({ cadd: [], pdf: [] })
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={updateStatusMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={updateStatusMutation.isPending || hasActiveUploads}
                    title={hasActiveUploads ? 'Please wait for uploads to complete' : ''}
                  >
                    {updateStatusMutation.isPending && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {updateStatusMutation.isPending
                      ? 'Updating...'
                      : hasActiveUploads
                        ? 'Uploads in progress...'
                        : 'Update Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Initial File Upload Modal */}
      <InitialFileUploadModal
        isOpen={showUploadModal}
        onClose={(hasUploadedFiles) => {
          setShowUploadModal(false)

          // If files were uploaded, stay on drawing detail page (refresh already happened)
          // If no files uploaded, navigate away based on role
          if (!hasUploadedFiles) {
            if (user?.role === 'Draftsman' && fromTasks && taskId) {
              router.push(`/tasks/${taskId}`)
            } else {
              router.push(`/projects/${projectId}?tab=drawings`)
            }
          }
        }}
        onUploadComplete={async () => {
          // Invalidate all related queries to refresh the UI
          await queryClient.invalidateQueries({ queryKey: ['drawings', 'detail', drawingId] })
          await queryClient.invalidateQueries({ queryKey: ['drawings', 'status-history', drawingId] })
          await queryClient.invalidateQueries({ queryKey: ['drawings', 'files', drawingId] })
          await queryClient.invalidateQueries({ queryKey: ['drawings', drawingId, 'files-from-base'] })
          await queryClient.invalidateQueries({ queryKey: ['revisionHistoryDetail'], exact: false })

          // Explicitly refetch queries to ensure data is fresh
          await queryClient.refetchQueries({ queryKey: ['drawings', 'detail', drawingId] })
          await queryClient.refetchQueries({ queryKey: ['drawings', 'status-history', drawingId] })
          await queryClient.refetchQueries({ queryKey: ['drawings', 'files', drawingId] })
          await queryClient.refetchQueries({ queryKey: ['drawings', drawingId, 'files-from-base'] })

          // Small delay to ensure queries have fully updated before refresh
          await new Promise(resolve => setTimeout(resolve, 300))

          // Force router refresh to update the page
          router.refresh()
        }}
        entityType="project"
        entityId={projectId}
        drawingId={drawingId}
        entityCode={project?.projectNumber}
        drawingCode={drawing?.drawingNumber}
      />

      {/* PDF Viewer Modal */}
      {pdfViewerData && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-40"
            onClick={() => setPdfViewerData(null)}
          ></div>

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex-1 min-w-0 mr-4">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {pdfViewerData.filename}
                  </h3>
                  {(pdfViewerData.uploadedBy || pdfViewerData.uploadedAt) && (
                    <p className="text-sm text-gray-500 mt-1">
                      {pdfViewerData.uploadedBy && `Uploaded by ${pdfViewerData.uploadedBy}`}
                      {pdfViewerData.uploadedBy && pdfViewerData.uploadedAt && ' on '}
                      {pdfViewerData.uploadedAt}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={pdfViewerData.url}
                    download={pdfViewerData.filename}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    title="Download"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </a>
                  <button
                    onClick={() => setPdfViewerData(null)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    title="Close"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* PDF Content */}
              <div className="flex-1 overflow-hidden bg-gray-100">
                <iframe
                  src={pdfViewerData.url}
                  className="w-full h-full border-0"
                  title="PDF Viewer"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* CADD Viewer Modal */}
      {caddViewerData && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-40"
            onClick={() => setCaddViewerData(null)}
          ></div>

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex-1 min-w-0 mr-4">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {caddViewerData.filename}
                  </h3>
                  {(caddViewerData.uploadedBy || caddViewerData.uploadedAt) && (
                    <p className="text-sm text-gray-500 mt-1">
                      {caddViewerData.uploadedBy && `Uploaded by ${caddViewerData.uploadedBy}`}
                      {caddViewerData.uploadedBy && caddViewerData.uploadedAt && ' on '}
                      {caddViewerData.uploadedAt}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={caddViewerData.url}
                    download={caddViewerData.filename}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    title="Download"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </a>
                  <button
                    onClick={() => setCaddViewerData(null)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    title="Close"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* CADD Content */}
              <div className="flex-1 overflow-hidden bg-gray-100">
                <iframe
                  src={caddViewerData.url}
                  className="w-full h-full border-0"
                  title="CADD Viewer"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete File Confirmation Dialog */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete File</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-medium">{fileToDelete.filename}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFile}
                disabled={deletingFileUrl === fileToDelete.url}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingFileUrl === fileToDelete.url ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Base File Confirmation Dialog */}
      {baseFileToDelete && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Base File</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-medium">{baseFileToDelete.filename}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setBaseFileToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={deletingBaseFileUrl === baseFileToDelete.url}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBaseFile}
                disabled={deletingBaseFileUrl === baseFileToDelete.url}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingBaseFileUrl === baseFileToDelete.url ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resumable Upload Modal */}
      {showResumableModal && (selectedFile || restoredSessionId) && (
        <ResumableUploadModal
          isOpen={showResumableModal}
          onClose={() => {
            setShowResumableModal(false)
            setSelectedFile(null)
            setFileContext(null)
            setIsUploadMinimized(false)
            setMinimizedUploadData(null)
            setRestoredSessionId(null)
          }}
          entityType="drawing_file"
          entityId={drawingId}
          file={selectedFile}
          sessionId={restoredSessionId}
          context={{
            pageType: 'project',
            pageId: projectId,
            drawingId: drawingId,
            fileContext: fileContext || undefined,
          }}
          onUploadComplete={(result) => {
            // Handle upload completion based on context
            if (fileContext === 'status-cadd') {
              // Add uploaded CADD file to the list
              setUploadedFiles(prev => ({
                ...prev,
                cadd: [...prev.cadd, {
                  name: selectedFile?.name || 'uploaded-file',
                  url: result.fileUrl,
                  size: selectedFile?.size || 0
                }]
              }))
              // Clear error if any
              const { caddFiles: _, ...restErrors } = statusErrors
              setStatusErrors(restErrors)
            } else if (fileContext === 'status-pdf') {
              // Add uploaded PDF file to the list
              setUploadedFiles(prev => ({
                ...prev,
                pdf: [...prev.pdf, {
                  name: selectedFile?.name || 'uploaded-file',
                  url: result.fileUrl,
                  size: selectedFile?.size || 0
                }]
              }))
              // Clear error if any
              const { pdfFiles: _, ...restErrors } = statusErrors
              setStatusErrors(restErrors)
            } else if (fileContext === 'version') {
              // Refresh file versions
              queryClient.invalidateQueries({ queryKey: ['drawing', drawingId] })
              queryClient.invalidateQueries({ queryKey: ['drawings', drawingId, 'status-history'] })
            } else if (fileContext === 'file') {
              // Refresh drawing files
              queryClient.invalidateQueries({ queryKey: ['drawings', drawingId, 'files'] })
              queryClient.invalidateQueries({ queryKey: ['drawing', drawingId] })
            }

            // Reset states
            setShowResumableModal(false)
            setSelectedFile(null)
            setFileContext(null)
            setIsUploadMinimized(false)
            setMinimizedUploadData(null)
          }}
          onMinimize={(uploadData) => {
            setMinimizedUploadData(uploadData)
            setIsUploadMinimized(true)
            setShowResumableModal(false)
          }}
        />
      )}

      {/* Minimized Upload Progress Indicator */}
      {isUploadMinimized && minimizedUploadData && (
        <UploadProgressIndicator
          progress={minimizedUploadData.progress}
          filename={minimizedUploadData.filename}
          uploadedChunks={minimizedUploadData.uploadedChunks}
          totalChunks={minimizedUploadData.totalChunks}
          isPaused={minimizedUploadData.isPaused}
          onClick={() => {
            setShowResumableModal(true)
            setIsUploadMinimized(false)
          }}
        />
      )}

      {/* Multi-File Upload Modal */}
      {showMultiFileUploadModal && multiFileUploadContext && (
        <MultiFileUploadModal
          isOpen={showMultiFileUploadModal}
          onClose={() => {
            setShowMultiFileUploadModal(false)
            setMultiFileUploadContext(null)
          }}
          entityType="project"
          entityId={projectId}
          drawingId={drawingId}
          fileContext={multiFileUploadContext}
          bidCode={project?.projectNumber} // Pass project number for folder structure
          drawingCode={drawing?.drawingNumber} // Pass drawing number for folder structure
          acceptedFileTypes={
            multiFileUploadContext === 'status-cadd'
              ? '.dwg,.dxf,.rvt,.rfa,.nwd,.nwc'
              : '.pdf,application/pdf'
          }
          maxFiles={10}
          onUploadComplete={async (results) => {
            // Update uploadedFiles state based on context
            if (multiFileUploadContext === 'status-cadd') {
              setUploadedFiles(prev => ({
                ...prev,
                cadd: [
                  ...prev.cadd,
                  ...results.map(r => ({
                    name: r.filename,
                    url: r.fileUrl,
                    size: 0 // Size not available from upload result
                  }))
                ]
              }))
              // Clear error if any
              const { caddFiles: _, ...restErrors } = statusErrors
              setStatusErrors(restErrors)
            } else if (multiFileUploadContext === 'status-pdf') {
              setUploadedFiles(prev => ({
                ...prev,
                pdf: [
                  ...prev.pdf,
                  ...results.map(r => ({
                    name: r.filename,
                    url: r.fileUrl,
                    size: 0 // Size not available from upload result
                  }))
                ]
              }))
              // Clear error if any
              const { pdfFiles: _, ...restErrors } = statusErrors
              setStatusErrors(restErrors)
            }

            // Invalidate queries to refetch the drawing status history and show uploaded files
            await queryClient.invalidateQueries({
              queryKey: ['revisionHistoryDetail', initialStatusHistoryId],
            })
            await queryClient.invalidateQueries({
              queryKey: ['drawingStatusHistory', drawingId],
            })
            await queryClient.invalidateQueries({
              queryKey: ['drawings', 'detail', drawingId],
            })
          }}
        />
      )}

      {/* Inline File Viewer Modal */}
      {viewingBaseFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[95vh] m-4 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{viewingBaseFile.filename}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadBaseFile(viewingBaseFile.url)}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Download
                </button>
                <button
                  onClick={() => setViewingBaseFile(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto bg-gray-100 flex flex-col items-center p-4">
              {viewingBaseFile.type === 'pdf' ? (
                <PDFViewer url={viewingBaseFile.url} filename={viewingBaseFile.filename} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <img
                    src={viewingBaseFile.url}
                    alt={viewingBaseFile.filename}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  )
}
