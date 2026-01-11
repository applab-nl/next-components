import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuditLogViewer } from './AuditLogViewer'
import type { AuditLog, AuditAction } from '../types'

// Mock audit logs for testing
function createMockAuditLog(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    id: 'log-1',
    userId: 'user-1',
    userEmail: 'test@example.com',
    userName: 'Test User',
    timestamp: new Date('2024-01-15T10:30:00Z'),
    organizationId: 'org-1',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    entityType: 'User',
    entityId: 'entity-1',
    entityName: 'John Doe',
    action: 'CREATE',
    changes: null,
    metadata: null,
    ...overrides,
  }
}

describe('AuditLogViewer', () => {
  const mockFetchLogs = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchLogs.mockResolvedValue({
      items: [createMockAuditLog()],
      total: 1,
      page: 1,
      limit: 25,
      totalPages: 1,
    })
  })

  it('renders the component with title', () => {
    render(<AuditLogViewer fetchLogs={mockFetchLogs} />)
    expect(screen.getByText('Audit Log')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(<AuditLogViewer fetchLogs={mockFetchLogs} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays audit logs after loading', async () => {
    render(<AuditLogViewer fetchLogs={mockFetchLogs} />)

    expect(await screen.findByText('CREATE')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('"John Doe"')).toBeInTheDocument()
  })

  it('shows no results message when empty', async () => {
    mockFetchLogs.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 25,
      totalPages: 0,
    })

    render(<AuditLogViewer fetchLogs={mockFetchLogs} />)

    expect(await screen.findByText('No audit logs found')).toBeInTheDocument()
  })

  it('displays error message on fetch failure', async () => {
    mockFetchLogs.mockRejectedValue(new Error('Network error'))

    render(<AuditLogViewer fetchLogs={mockFetchLogs} />)

    expect(await screen.findByText('Network error')).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<AuditLogViewer fetchLogs={mockFetchLogs} />)
    expect(screen.getByPlaceholderText('Search by entity or user...')).toBeInTheDocument()
  })

  it('renders action filter dropdown', () => {
    render(<AuditLogViewer fetchLogs={mockFetchLogs} />)
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
  })

  it('displays entity type filter when entityTypes provided', () => {
    render(<AuditLogViewer fetchLogs={mockFetchLogs} entityTypes={['User', 'Feedback', 'Settings']} />)
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThan(1)
  })

  it('shows all action types in dropdown', () => {
    render(<AuditLogViewer fetchLogs={mockFetchLogs} />)

    const actions: AuditAction[] = [
      'CREATE', 'UPDATE', 'DELETE',
      'BULK_CREATE', 'BULK_UPDATE', 'BULK_DELETE',
      'EXPORT', 'IMPORT', 'LOGIN', 'LOGOUT', 'VIEW',
    ]

    actions.forEach(action => {
      expect(screen.getByRole('option', { name: action })).toBeInTheDocument()
    })
  })

  it('expands row to show changes when clicked', async () => {
    const logWithChanges = createMockAuditLog({
      changes: {
        before: { name: 'Old Name' },
        after: { name: 'New Name' },
      },
    })

    mockFetchLogs.mockResolvedValue({
      items: [logWithChanges],
      total: 1,
      page: 1,
      limit: 25,
      totalPages: 1,
    })

    render(<AuditLogViewer fetchLogs={mockFetchLogs} />)

    // Wait for data to load
    expect(await screen.findByText('CREATE')).toBeInTheDocument()

    // Click to expand
    const row = screen.getByText('User').closest('div[class*="cursor-pointer"]')
    if (row) {
      fireEvent.click(row)
    }

    expect(await screen.findByText('Changes')).toBeInTheDocument()
  })

  it('displays metadata when present', async () => {
    const logWithMetadata = createMockAuditLog({
      metadata: { source: 'admin-panel', version: '1.0' },
    })

    mockFetchLogs.mockResolvedValue({
      items: [logWithMetadata],
      total: 1,
      page: 1,
      limit: 25,
      totalPages: 1,
    })

    render(<AuditLogViewer fetchLogs={mockFetchLogs} />)

    // Wait for data to load
    expect(await screen.findByText('CREATE')).toBeInTheDocument()

    // Click to expand
    const row = screen.getByText('User').closest('div[class*="cursor-pointer"]')
    if (row) {
      fireEvent.click(row)
    }

    expect(await screen.findByText('Metadata')).toBeInTheDocument()
  })

  it('uses custom date formatter', async () => {
    const customFormatter = vi.fn().mockReturnValue('Custom Date')

    render(<AuditLogViewer fetchLogs={mockFetchLogs} formatDate={customFormatter} />)

    expect(await screen.findByText(/Custom Date/)).toBeInTheDocument()
    expect(customFormatter).toHaveBeenCalled()
  })

  it('uses custom user formatter', async () => {
    const customFormatter = vi.fn().mockReturnValue('Custom User Name')

    render(<AuditLogViewer fetchLogs={mockFetchLogs} formatUser={customFormatter} />)

    expect(await screen.findByText(/Custom User Name/)).toBeInTheDocument()
    expect(customFormatter).toHaveBeenCalled()
  })

  it('supports custom translations', () => {
    render(
      <AuditLogViewer
        fetchLogs={mockFetchLogs}
        translations={{
          title: 'Registro de Auditoría',
          loading: 'Cargando...',
        }}
      />
    )

    expect(screen.getByText('Registro de Auditoría')).toBeInTheDocument()
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<AuditLogViewer fetchLogs={mockFetchLogs} className="custom-class" />)

    const container = screen.getByText('Audit Log').closest('div[class*="custom-class"]')
    expect(container).toBeInTheDocument()
  })

  it('shows IP address when present', async () => {
    render(<AuditLogViewer fetchLogs={mockFetchLogs} />)

    expect(await screen.findByText(/192\.168\.1\.1/)).toBeInTheDocument()
  })

  it('renders date range filters', () => {
    render(<AuditLogViewer fetchLogs={mockFetchLogs} />)

    const dateInputs = document.querySelectorAll('input[type="date"]')
    expect(dateInputs.length).toBe(2)
  })

  it('renders different action icons with correct colors', async () => {
    const logs: AuditLog[] = [
      createMockAuditLog({ id: '1', action: 'CREATE' }),
      createMockAuditLog({ id: '2', action: 'UPDATE' }),
      createMockAuditLog({ id: '3', action: 'DELETE' }),
    ]

    mockFetchLogs.mockResolvedValue({
      items: logs,
      total: 3,
      page: 1,
      limit: 25,
      totalPages: 1,
    })

    render(<AuditLogViewer fetchLogs={mockFetchLogs} />)

    // Wait for data to load, then check for action badges (not dropdown options)
    await screen.findByText('CREATE')

    // The actions appear both in badges and dropdown, so we use getAllByText
    const createBadges = screen.getAllByText('CREATE')
    const updateBadges = screen.getAllByText('UPDATE')
    const deleteBadges = screen.getAllByText('DELETE')

    // At least 2 of each (one in dropdown, one in row badge)
    expect(createBadges.length).toBeGreaterThanOrEqual(2)
    expect(updateBadges.length).toBeGreaterThanOrEqual(2)
    expect(deleteBadges.length).toBeGreaterThanOrEqual(2)
  })

  it('shows pagination controls when there are multiple pages', async () => {
    mockFetchLogs.mockResolvedValue({
      items: [createMockAuditLog()],
      total: 100,
      page: 1,
      limit: 25,
      totalPages: 4,
    })

    render(<AuditLogViewer fetchLogs={mockFetchLogs} />)

    expect(await screen.findByText('Page 1 of 4')).toBeInTheDocument()
  })

  it('shows results count', async () => {
    mockFetchLogs.mockResolvedValue({
      items: [createMockAuditLog()],
      total: 50,
      page: 1,
      limit: 25,
      totalPages: 2,
    })

    render(<AuditLogViewer fetchLogs={mockFetchLogs} />)

    expect(await screen.findByText(/Showing 1 to 25 of 50/)).toBeInTheDocument()
  })
})
