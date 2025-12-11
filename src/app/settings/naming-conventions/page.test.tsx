/**
 * Naming Conventions Page Unit Tests
 *
 * Tests for the Naming Conventions settings page component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import NamingConventionsPage from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock api-client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

// Mock SettingsLayout
jest.mock('@/components/settings/SettingsLayout', () => {
  return function MockSettingsLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="settings-layout">{children}</div>;
  };
});

describe('NamingConventionsPage', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  const mockNamingConventions = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    orgId: '123e4567-e89b-12d3-a456-426614174000',
    bidPrefix: 'BID',
    projectPrefix: 'PRJ',
    ticketPrefix: 'TKT',
    taskPrefix: 'TSK',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };

  const mockPreview = {
    bidPreview: 'BID-000001',
    projectPreview: 'PRJ-000001',
    ticketPreview: 'TKT-000001',
    taskPreview: 'TSK-000001',
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (apiClient.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('/preview')) {
        return Promise.resolve(mockPreview);
      }
      return Promise.resolve(mockNamingConventions);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading skeleton initially', () => {
      render(<NamingConventionsPage />);
      expect(screen.getByTestId('settings-layout')).toBeInTheDocument();
    });
  });

  describe('Form Rendering', () => {
    it('should render all input fields with initial data', async () => {
      render(<NamingConventionsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Bid Prefix/i)).toHaveValue('BID');
        expect(screen.getByLabelText(/Project Prefix/i)).toHaveValue('PRJ');
        expect(screen.getByLabelText(/Ticket Prefix/i)).toHaveValue('TKT');
        expect(screen.getByLabelText(/Task Prefix/i)).toHaveValue('TSK');
      });
    });

    it('should display preview values', async () => {
      render(<NamingConventionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/BID-000001/)).toBeInTheDocument();
        expect(screen.getByText(/PRJ-000001/)).toBeInTheDocument();
        expect(screen.getByText(/TKT-000001/)).toBeInTheDocument();
        expect(screen.getByText(/TSK-000001/)).toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('should show error for empty field on submit', async () => {
      render(<NamingConventionsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Bid Prefix/i)).toBeInTheDocument();
      });

      const bidInput = screen.getByLabelText(/Bid Prefix/i);
      fireEvent.change(bidInput, { target: { value: '' } });

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/This field is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for field exceeding 12 characters', async () => {
      render(<NamingConventionsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Bid Prefix/i)).toBeInTheDocument();
      });

      const bidInput = screen.getByLabelText(/Bid Prefix/i);
      fireEvent.change(bidInput, { target: { value: 'VERYLONGPREFIX123' } });

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Must be between 1 and 12 characters/i)).toBeInTheDocument();
      });
    });

    it('should convert lowercase to uppercase', async () => {
      render(<NamingConventionsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Bid Prefix/i)).toBeInTheDocument();
      });

      const bidInput = screen.getByLabelText(/Bid Prefix/i);
      fireEvent.change(bidInput, { target: { value: 'custom' } });

      expect(bidInput).toHaveValue('CUSTOM');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      (apiClient.put as jest.Mock).mockResolvedValue({});

      render(<NamingConventionsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Bid Prefix/i)).toBeInTheDocument();
      });

      const bidInput = screen.getByLabelText(/Bid Prefix/i);
      fireEvent.change(bidInput, { target: { value: 'CUSTOM' } });

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalledWith(
          '/organization-settings/naming-conventions',
          expect.objectContaining({
            bidPrefix: 'CUSTOM',
          })
        );
      });
    });

    it('should show success toast after successful save', async () => {
      (apiClient.put as jest.Mock).mockResolvedValue({});

      render(<NamingConventionsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Bid Prefix/i)).toBeInTheDocument();
      });

      const bidInput = screen.getByLabelText(/Bid Prefix/i);
      fireEvent.change(bidInput, { target: { value: 'CUSTOM' } });

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Saved successfully/i)).toBeInTheDocument();
      });
    });

    it('should show error message on save failure', async () => {
      (apiClient.put as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<NamingConventionsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Bid Prefix/i)).toBeInTheDocument();
      });

      const bidInput = screen.getByLabelText(/Bid Prefix/i);
      fireEvent.change(bidInput, { target: { value: 'CUSTOM' } });

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to save naming conventions/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Button', () => {
    it('should reset form to initial values on cancel', async () => {
      render(<NamingConventionsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Bid Prefix/i)).toBeInTheDocument();
      });

      const bidInput = screen.getByLabelText(/Bid Prefix/i);
      fireEvent.change(bidInput, { target: { value: 'CUSTOM' } });

      expect(bidInput).toHaveValue('CUSTOM');

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(bidInput).toHaveValue('BID');
    });
  });

  describe('Read-Only Mode', () => {
    it('should show read-only message when user lacks edit permission', async () => {
      (apiClient.get as jest.Mock).mockImplementation((url) => {
        if (url.includes('/preview')) {
          return Promise.resolve(mockPreview);
        }
        if (url.includes('/naming-conventions')) {
          return Promise.reject({ response: { status: 403 } });
        }
        return Promise.resolve(mockNamingConventions);
      });

      render(<NamingConventionsPage />);

      await waitFor(() => {
        expect(screen.getByText(/You do not have permission to view naming conventions/i)).toBeInTheDocument();
      });
    });
  });
});
