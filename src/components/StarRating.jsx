import { useState } from 'react'
import { Star } from 'lucide-react'

export default function StarRating({ label, value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-20 shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className="transition-colors disabled:cursor-default"
          >
            <Star
              className="w-5 h-5"
              fill={(hovered || value) >= star ? '#6366f1' : 'none'}
              stroke={(hovered || value) >= star ? '#6366f1' : '#d1d5db'}
            />
          </button>
        ))}
      </div>
      <span className="text-xs text-indigo-500 font-medium w-6">{value > 0 ? `${value}점` : ''}</span>
    </div>
  )
}
