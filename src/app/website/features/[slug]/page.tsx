import { notFound } from 'next/navigation'
import { InfoCardGrid } from '@/components/website/InfoCardGrid'

type FeatureDetail = {
  title: string
  promise: string
  problem: string[]
  outcomes: string[]
  capabilities: string[]
  workflow: string[]
  results: string[]
}

const detailMap: Record<string, FeatureDetail> = {
  bids: {
    title: 'Bids & Estimates',
    promise: 'Structured intake, approvals, and clean handoff into projects.',
    problem: ['Inconsistent bid templates create rework', 'Approvals stall without clear owners', 'Project handoffs lose critical context'],
    outcomes: ['Standardized bids', 'Approvals on rails', 'Smooth transition to projects'],
    capabilities: ['Template-driven bid intake', 'Approval routing with notifications', 'Versioned proposals and history', 'Auto-handoff into projects with preserved context'],
    workflow: ['Capture requests with required fields', 'Route to reviewers/approvers', 'Lock in approved scope and pricing', 'Push to project setup with linked artifacts'],
    results: ['Fewer stalled bids', 'Clear scope control', 'Faster project kickoffs'],
  },
  projects: {
    title: 'Projects & Schedules',
    promise: 'Milestones, dependencies, and dashboards that stay current.',
    problem: ['Schedules drift without visibility', 'Changes aren’t captured in one place', 'Stakeholders lack a single source of truth'],
    outcomes: ['Aligned schedules', 'Controlled changes', 'Shared visibility'],
    capabilities: ['Milestones and dependencies', 'Change control and approvals', 'Dashboards for budget/progress', 'Cross-link to drawings, tickets, and tasks'],
    workflow: ['Define milestones and owners', 'Link work items to the plan', 'Surface risks and changes', 'Report progress with live data'],
    results: ['Predictable delivery', 'Controlled scope changes', 'Stakeholder confidence'],
  },
  drawings: {
    title: 'Drawings & Revisions',
    promise: 'Versioned drawings with permissioned access and audit-ready history.',
    problem: ['Revisions get lost across email threads', 'Unauthorized edits risk compliance', 'Finding the latest version wastes time'],
    outcomes: ['Single source of truth', 'Secure access', 'Traceable history'],
    capabilities: ['Revision control and status history', 'Role-based visibility and sharing', 'Azure-backed storage for files', 'Linked markups and comments'],
    workflow: ['Upload or revise with required metadata', 'Route for review/approval', 'Publish with permissions', 'Track history and access logs'],
    results: ['Fewer revision errors', 'Faster approvals', 'Confidence in “latest”'],
  },
  tickets: {
    title: 'Tickets & Issue Tracking',
    promise: 'Capture, prioritize, and notify the right owners with clear SLAs.',
    problem: ['Issues slip without ownership', 'Priorities aren’t enforced', 'Stakeholders lack status clarity'],
    outcomes: ['Clear ownership', 'SLA adherence', 'Transparent status'],
    capabilities: ['Queues with priority and SLA hints', 'Notifications and reminders', 'Links to projects/drawings', 'Status and assignment history'],
    workflow: ['Capture with required fields', 'Auto-assign or route to teams', 'Track status and SLA timers', 'Close with context and audit trail'],
    results: ['Faster resolution', 'Predictable response', 'Reduced reopen rates'],
  },
  tasks: {
    title: 'Tasks & Work Management',
    promise: 'Assignments, due dates, and checklists tied to the plan.',
    problem: ['Tasks live outside the project plan', 'Owners and due dates are unclear', 'Status updates are scattered'],
    outcomes: ['Linked work', 'Clear accountability', 'Consistent status'],
    capabilities: ['Assignments and due dates', 'Checklists and status updates', 'Project and ticket linkage', 'Notifications on changes'],
    workflow: ['Create tasks from the plan or tickets', 'Assign owners and due dates', 'Track progress with checklists', 'Roll up status to projects'],
    results: ['Better predictability', 'Fewer missed handoffs', 'Aligned execution'],
  },
  timesheets: {
    title: 'Timesheets & Approvals',
    promise: 'Submit, review, and approve time without leaving the project context.',
    problem: ['Time capture is disconnected from work', 'Approvals are slow or ambiguous', 'Exporting time for reporting is painful'],
    outcomes: ['Accurate time', 'Faster approvals', 'Easy exports'],
    capabilities: ['Time entry tied to projects/tasks', 'Approval workflows', 'Export-ready data', 'Status visibility for submitters and approvers'],
    workflow: ['Log time against tasks/projects', 'Route for approval', 'Track pending/approved status', 'Export for reporting/billing'],
    results: ['Cleaner utilization data', 'Timely approvals', 'Reliable reporting'],
  },
  audit: {
    title: 'Audit Logs & Compliance',
    promise: 'Org-wide trails with exportable evidence across modules.',
    problem: ['No unified audit trail', 'Hard to prove who did what, when', 'Compliance reviews slow delivery'],
    outcomes: ['Complete traceability', 'Exportable evidence', 'Faster reviews'],
    capabilities: ['Per-action logging across modules', 'Filters and exports', 'Retention controls', 'Org-isolated data'],
    workflow: ['Capture actions automatically', 'Filter by module/user/time', 'Export evidence for auditors', 'Retain per policy'],
    results: ['Audit-ready posture', 'Reduced review time', 'Higher trust'],
  },
  rbac: {
    title: 'RBAC & Security',
    promise: 'Granular permissions, JWT + CSRF protections, and multi-tenant isolation.',
    problem: ['Access is too open or too restrictive', 'Sessions lack modern protections', 'No clear separation between orgs'],
    outcomes: ['Least-privilege access', 'Secure sessions', 'Tenant isolation'],
    capabilities: ['Roles and permissions per module/action', 'JWT auth with refresh', 'CSRF protection across writes', 'Org-bound data access'],
    workflow: ['Define roles and scopes', 'Apply to users/teams', 'Enforce on every route/action', 'Monitor via audit logs'],
    results: ['Reduced risk surface', 'Consistent enforcement', 'Compliance-friendly controls'],
  },
}

export default function WebsiteFeatureDetailPage({ params }: { params: { slug: string } }) {
  const detail = detailMap[params.slug]

  if (!detail) {
    notFound()
  }

  return (
    <div className="bg-white">
      <div className="bg-gradient-to-b from-white to-gray-50">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Feature</p>
          <h1 className="mt-2 text-4xl font-bold text-gray-900 sm:text-5xl">{detail.title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-600">{detail.promise}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/auth/signup"
              className="rounded-md bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              Book a demo
            </a>
            <a
              href="/website/pricing"
              className="rounded-md border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:border-primary-200 hover:text-primary-700"
            >
              View pricing
            </a>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <InfoCardGrid
          cards={[
            { title: 'Problems solved', items: detail.problem },
            { title: 'Outcomes', items: detail.outcomes },
            { title: 'Results', items: detail.results },
          ]}
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <InfoCardGrid cards={[{ title: 'Key capabilities', items: detail.capabilities }]} />
          <InfoCardGrid cards={[{ title: 'Workflow snapshot', items: detail.workflow }]} />
        </div>
      </section>
    </div>
  )
}

