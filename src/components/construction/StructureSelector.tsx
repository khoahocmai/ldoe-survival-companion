import React from 'react';
import { Link } from 'react-router-dom';
import { Bike, Building2, MapPin } from 'lucide-react';
import { Location, LocationStructure } from '../../types';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { Field, Select } from '../common/Field';

/** The few fields shown here, so a placeholder for a location missing from the data also fits. */
type PlaceRef = Pick<Location, 'id' | 'name' | 'vietnameseName' | 'description'>;

interface StructureSelectorProps {
  locations: PlaceRef[];
  selectedLocationId: string;
  onLocationChange: (id: string) => void;
  /** Structures at the selected location. */
  structures: LocationStructure[];
  activeStructureId?: string;
  onStructureChange: (id: string) => void;
  location?: PlaceRef;
}

/** Left column: pick a place, then one of its structures; shows a short note about the place. */
export const StructureSelector: React.FC<StructureSelectorProps> = ({
  locations,
  selectedLocationId,
  onLocationChange,
  structures,
  activeStructureId,
  onStructureChange,
  location,
}) => (
  <Card className="space-y-4">
    <Field label="1. Chọn địa điểm">
      <Select value={selectedLocationId} onChange={(e) => onLocationChange(e.target.value)}>
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.vietnameseName ? `${loc.vietnameseName} (${loc.name})` : loc.name}
          </option>
        ))}
      </Select>
    </Field>

    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted">2. Chỗ cần nộp / hạng mục</h3>
        <span className="num text-xs text-muted">{structures.length} chỗ</span>
      </div>

      <div className="space-y-2">
        {structures.map((s) => {
          const isSelected = s.id === activeStructureId;
          const isRecurring = s.frequency === 'recurring';
          const Icon = isRecurring ? Bike : Building2;

          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onStructureChange(s.id)}
              className={`flex w-full items-start gap-3 rounded-control border p-3 text-left transition-colors ${
                isSelected ? 'border-accent-solid bg-accent-soft/40 ring-1 ring-accent-solid/40' : 'border-line bg-surface hover:bg-subtle'
              }`}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${isSelected ? 'text-accent' : 'text-muted'}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className={`truncate text-sm font-semibold ${isSelected ? 'text-fg' : 'text-muted'}`}>
                    {s.vietnameseName || s.name}
                  </span>
                  <Badge size="sm" tone={isRecurring ? 'accent' : 'neutral'}>
                    {isRecurring ? 'Nâng cấp' : '1 lần'}
                  </Badge>
                </div>
                {s.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{s.description}</p>}
              </div>
            </button>
          );
        })}
      </div>
    </div>

    {location && (
      <div className="space-y-1.5 rounded-control border border-line bg-subtle/30 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-medium text-fg">Thông tin địa điểm:</span>
          <Link
            to={`/wiki/locations?select=${location.id}`}
            className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
          >
            <MapPin className="h-3 w-3" />
            Xem bản đồ
          </Link>
        </div>
        {location.description && <p className="leading-relaxed text-muted">{location.description}</p>}
      </div>
    )}
  </Card>
);
