import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import BrandLogo from './BrandLogo'

describe('BrandLogo Component', () => {
  it('renders the brand parts (Stock, Flow, AI) and subtitle with modern slate styling', () => {
    render(<BrandLogo showSubtitle={true} />)

    expect(screen.getByText('Stock')).toBeInTheDocument()
    expect(screen.getByText('Flow')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.getByText('Intelligent Supply Chain SaaS')).toBeInTheDocument()
  })

  it('hides subtitle when showSubtitle is false', () => {
    render(<BrandLogo showSubtitle={false} />)

    expect(screen.queryByText('Intelligent Supply Chain SaaS')).not.toBeInTheDocument()
  })
})
