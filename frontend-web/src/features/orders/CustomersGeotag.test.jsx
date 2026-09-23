import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MapPin, ExternalLink } from 'lucide-react'

// Component representing the GPS Geotag renderer
function CustomerGeotagBadge({ latitude, longitude }) {
  if (latitude && longitude) {
    return (
      <a
        href={`https://www.google.com/maps?q=${latitude},${longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="geotag-link"
        className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
      >
        <MapPin className="w-3.5 h-3.5 text-emerald-600" data-testid="mappin-icon" />
        <span>{parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}</span>
        <ExternalLink className="w-2.5 h-2.5 text-emerald-500" />
      </a>
    )
  }

  return (
    <span data-testid="no-gps-badge" className="inline-flex items-center gap-1 text-xs text-stone-400">
      <MapPin className="w-3 h-3 text-stone-300" />
      <span>No GPS</span>
    </span>
  )
}

describe('Customer GPS Geotag Feature', () => {
  it('renders Google Maps link with formatted coordinates when GPS is provided', () => {
    render(<CustomerGeotagBadge latitude={6.927079} longitude={79.861244} />)

    const link = screen.getByTestId('geotag-link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://www.google.com/maps?q=6.927079,79.861244')
    expect(screen.getByText('6.9271, 79.8612')).toBeInTheDocument()
  })

  it('renders No GPS fallback when coordinates are null or missing', () => {
    render(<CustomerGeotagBadge latitude={null} longitude={null} />)

    expect(screen.getByTestId('no-gps-badge')).toBeInTheDocument()
    expect(screen.getByText('No GPS')).toBeInTheDocument()
  })
})
