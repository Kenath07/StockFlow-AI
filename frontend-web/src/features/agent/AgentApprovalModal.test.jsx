import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

function AgentProposalCard({ proposal, onApprove, onReject }) {
  return (
    <div data-testid="proposal-card" className="p-4 border rounded-xl bg-white shadow-sm">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-slate-800">{proposal.productName}</h4>
        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono">
          {proposal.productSku}
        </span>
      </div>
      <p className="text-sm text-slate-600 mt-2">{proposal.justification}</p>
      <div className="mt-3 flex gap-4 text-xs font-medium text-slate-500">
        <div>Current: <span className="font-bold text-slate-700">{proposal.currentStock}</span></div>
        <div>Proposed: <span className="font-bold text-indigo-600">{proposal.proposedQuantity}</span></div>
        <div>Confidence: <span className="font-bold text-emerald-600">{proposal.confidenceScore}%</span></div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onApprove(proposal.productId)}
          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500"
        >
          Approve Reorder
        </button>
        <button
          onClick={() => onReject(proposal.productId)}
          className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold hover:bg-rose-100"
        >
          Reject
        </button>
      </div>
    </div>
  )
}

describe('Agent Reorder Approval Component', () => {
  const mockProposal = {
    productId: 'bev-001',
    productName: 'Ceylon Premium Black Tea 500g',
    productSku: 'BEV-TEA-001',
    currentStock: 8,
    proposedQuantity: 50,
    confidenceScore: 85,
    justification: 'Stock 8 units is below threshold 15.',
  }

  it('renders proposal details, confidence score, and metrics accurately', () => {
    render(<AgentProposalCard proposal={mockProposal} onApprove={() => {}} onReject={() => {}} />)

    expect(screen.getByText('Ceylon Premium Black Tea 500g')).toBeInTheDocument()
    expect(screen.getByText('BEV-TEA-001')).toBeInTheDocument()
    expect(screen.getByText('Stock 8 units is below threshold 15.')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('triggers approve and reject callbacks when buttons are clicked', () => {
    const handleApprove = vi.fn()
    const handleReject = vi.fn()

    render(
      <AgentProposalCard
        proposal={mockProposal}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    )

    fireEvent.click(screen.getByText('Approve Reorder'))
    expect(handleApprove).toHaveBeenCalledWith('bev-001')

    fireEvent.click(screen.getByText('Reject'))
    expect(handleReject).toHaveBeenCalledWith('bev-001')
  })
})
