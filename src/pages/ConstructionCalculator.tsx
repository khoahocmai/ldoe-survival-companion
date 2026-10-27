import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Calculator, Check } from 'lucide-react';
import { useGameData } from '../context/DataContext';
import { DEFAULT_CHOPPER_ACCEPTED_ITEMS } from '../lib/calculators/chopperCalculator';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { EmptyState, PageHeader } from '../components/common/Layout';
import { ChopperCalculatorDialog } from '../components/construction/ChopperCalculatorDialog';
import { ChopperGuide, DEFAULT_PERK_GUIDE } from '../components/construction/ChopperGuide';
import { ConstructionCalculatorDialog } from '../components/construction/ConstructionCalculatorDialog';
import { StageList } from '../components/construction/StageList';
import { StructureSelector } from '../components/construction/StructureSelector';

const CHOPPER_STRUCTURE_ID = 'struct_gas_station_chopper';
const CHOPPER_LOCATION_ID = 'gas_station';

export const ConstructionCalculator: React.FC = () => {
  const { db } = useGameData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  const structures = useMemo(() => db?.locationStructures ?? [], [db]);

  // Only places that actually have something to hand in.
  const locationsWithStructures = useMemo(() => {
    if (!db || structures.length === 0) return [];
    const locationIds = Array.from(new Set(structures.map((s) => s.locationId)));
    return locationIds
      .map((id) => db.locationsMap.get(id) || { id, name: id, vietnameseName: id, description: '' })
      .sort((a, b) => (a.vietnameseName || a.name).localeCompare(b.vietnameseName || b.name, 'vi'));
  }, [db, structures]);

  const locationParam = searchParams.get('location');
  const structureParam = searchParams.get('structure');
  const tabParam = searchParams.get('tab');
  const wantsChopper = tabParam === 'chopper' || structureParam === CHOPPER_STRUCTURE_ID;

  const [selectedLocationId, setSelectedLocationId] = useState<string>(() => {
    if (wantsChopper) return CHOPPER_LOCATION_ID;
    if (structureParam) {
      const found = structures.find((s) => s.id === structureParam);
      if (found) return found.locationId;
    }
    return locationParam || CHOPPER_LOCATION_ID;
  });

  const [selectedStructureId, setSelectedStructureId] = useState<string>(() => {
    if (wantsChopper) return CHOPPER_STRUCTURE_ID;
    if (structureParam && structures.some((s) => s.id === structureParam)) return structureParam;
    return '';
  });

  // Follow the URL (links from the wiki, the search palette and the old /chopper route).
  useEffect(() => {
    if (wantsChopper) {
      setSelectedLocationId(CHOPPER_LOCATION_ID);
      setSelectedStructureId(CHOPPER_STRUCTURE_ID);
      return;
    }

    if (structureParam) {
      const found = structures.find((s) => s.id === structureParam);
      if (found) {
        setSelectedLocationId(found.locationId);
        setSelectedStructureId(found.id);
        return;
      }
    }

    if (locationParam && structures.some((s) => s.locationId === locationParam)) {
      setSelectedLocationId(locationParam);
      const matching = structures.filter((s) => s.locationId === locationParam);
      if (!matching.some((s) => s.id === selectedStructureId)) {
        setSelectedStructureId(matching[0]?.id ?? '');
      }
    } else if (!selectedLocationId && locationsWithStructures.length > 0) {
      const firstLoc = locationsWithStructures[0].id;
      setSelectedLocationId(firstLoc);
      setSelectedStructureId(structures.find((s) => s.locationId === firstLoc)?.id ?? '');
    }
  }, [locationParam, structureParam, wantsChopper, structures, locationsWithStructures]); // eslint-disable-line react-hooks/exhaustive-deps

  const structuresForLocation = useMemo(
    () => structures.filter((s) => s.locationId === selectedLocationId),
    [structures, selectedLocationId]
  );

  const structure = useMemo(
    () => structuresForLocation.find((s) => s.id === selectedStructureId) || structuresForLocation[0] || structures[0],
    [structuresForLocation, selectedStructureId, structures]
  );

  // Keep the selection inside the chosen location.
  useEffect(() => {
    if (structuresForLocation.length > 0 && !structuresForLocation.some((s) => s.id === selectedStructureId)) {
      setSelectedStructureId(structuresForLocation[0].id);
    }
  }, [structuresForLocation, selectedStructureId]);

  const handleLocationChange = (newLocId: string) => {
    setSelectedLocationId(newLocId);
    const firstId = structures.find((s) => s.locationId === newLocId)?.id ?? '';
    setSelectedStructureId(firstId);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('location', newLocId);
    if (firstId) nextParams.set('structure', firstId);
    nextParams.delete('tab');
    setSearchParams(nextParams, { replace: true });
  };

  const handleStructureChange = (newStructId: string) => {
    setSelectedStructureId(newStructId);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('structure', newStructId);
    nextParams.delete('tab');
    setSearchParams(nextParams, { replace: true });
  };

  if (!db || structures.length === 0) {
    return (
      <div>
        <PageHeader title="Công trình & Nâng cấp" icon={<Building2 />} />
        <EmptyState
          icon={<Building2 />}
          title="Chưa có dữ liệu"
          description="Thêm công trình vào locationStructures.json để sử dụng tính năng này."
        />
      </div>
    );
  }

  const isChopper = structure?.id === CHOPPER_STRUCTURE_ID || structure?.frequency === 'recurring';
  const acceptedItems = structure?.cycleConfig?.acceptedItems ?? DEFAULT_CHOPPER_ACCEPTED_ITEMS;
  const perkGuide = structure?.cycleConfig?.perkGuide ?? DEFAULT_PERK_GUIDE;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Công trình & Nâng cấp"
        description="Tra cứu nguyên liệu cần nộp theo từng địa điểm và mở máy tính kiểm tra tiến độ khi cần."
        icon={<Building2 />}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-4">
          <StructureSelector
            locations={locationsWithStructures}
            selectedLocationId={selectedLocationId}
            onLocationChange={handleLocationChange}
            structures={structuresForLocation}
            activeStructureId={structure?.id}
            onStructureChange={handleStructureChange}
            location={db.locationsMap.get(selectedLocationId)}
          />
        </div>

        <div className="space-y-4 xl:col-span-8">
          {structure && (
            <Card className="space-y-4">
              <div className="flex flex-col justify-between gap-3 border-b border-line pb-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-fg">{structure.vietnameseName || structure.name}</h2>
                    <Badge tone={isChopper ? 'accent' : 'info'}>
                      {isChopper ? 'Nâng cấp định kỳ (chu kỳ 24h)' : 'Công trình cố định (sửa 1 lần)'}
                    </Badge>
                  </div>
                  {structure.vietnameseName && <p className="mt-0.5 text-xs text-muted">{structure.name}</p>}
                </div>

                <Button className="shrink-0" icon={<Calculator />} onClick={() => setIsCalculatorOpen(true)}>
                  {isChopper ? 'Mở máy tính nâng cấp Chopper' : 'Mở máy tính nguyên liệu'}
                </Button>
              </div>

              {structure.description && <p className="text-sm leading-relaxed text-muted">{structure.description}</p>}

              {(structure.unlocks?.length || structure.notes) && (
                <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                  {structure.unlocks && structure.unlocks.length > 0 && (
                    <div className="rounded-control border border-line bg-subtle/40 p-3">
                      <span className="mb-1.5 block text-xs font-semibold text-muted">Phần thưởng mở khóa:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {structure.unlocks.map((u) => (
                          <Badge key={u} tone="ok">
                            <Check className="h-3 w-3" />
                            {u}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {structure.notes && (
                    <div className="rounded-control border border-line bg-subtle/40 p-3">
                      <span className="mb-1 block text-xs font-semibold text-muted">Ghi chú hữu ích:</span>
                      <p className="text-xs leading-relaxed text-muted">{structure.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {isChopper ? (
                <ChopperGuide acceptedItems={acceptedItems} perkGuide={perkGuide} itemsMap={db.itemsMap} />
              ) : (
                <StageList structure={structure} itemsMap={db.itemsMap} />
              )}
            </Card>
          )}
        </div>
      </div>

      {structure &&
        (isChopper ? (
          <ChopperCalculatorDialog
            isOpen={isCalculatorOpen}
            onClose={() => setIsCalculatorOpen(false)}
            acceptedItems={acceptedItems}
          />
        ) : (
          <ConstructionCalculatorDialog
            isOpen={isCalculatorOpen}
            onClose={() => setIsCalculatorOpen(false)}
            structure={structure}
          />
        ))}
    </div>
  );
};
