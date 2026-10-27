import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Bike,
  CheckCircle2,
  Layers,
  MapPin,
  Calculator,
  Award,
  Sparkles,
  RotateCcw,
  Info,
  Wrench,
  Check,
} from 'lucide-react';
import { useGameData } from '../context/DataContext';
import { calculateConstructionRequirements } from '../lib/calculators/constructionCalculator';
import {
  calculateChopperUpgrade,
  getChopperRequiredExp,
  getOptimalJunkCombo,
  DEFAULT_CHOPPER_ACCEPTED_ITEMS,
} from '../lib/calculators/chopperCalculator';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Checkbox, Field, NumberInput, Select } from '../components/common/Field';
import { Modal } from '../components/common/Modal';
import { Table, Tbody, Td, Th, Thead, Tr } from '../components/common/Table';
import { EmptyState, PageHeader, ProgressBar, Stat, StatGrid, Callout, ToggleChip } from '../components/common/Layout';
import { EntityImage } from '../components/common/EntityImage';
import { ITEM_CATEGORY_LABEL } from '../lib/labels';

export const ConstructionCalculator: React.FC = () => {
  const { db } = useGameData();
  const [searchParams, setSearchParams] = useSearchParams();

  // All location structures from data
  const structures = useMemo(() => db?.locationStructures ?? [], [db]);

  // List of locations that actually have at least one structure
  const locationsWithStructures = useMemo(() => {
    if (!db || structures.length === 0) return [];
    const locationIds = Array.from(new Set(structures.map((s) => s.locationId)));
    return locationIds
      .map((id) => db.locationsMap.get(id) || { id, name: id, vietnameseName: id, description: '' })
      .sort((a, b) => (a.vietnameseName || a.name).localeCompare(b.vietnameseName || b.name, 'vi'));
  }, [db, structures]);

  // Read URL search params
  const locationParam = searchParams.get('location');
  const structureParam = searchParams.get('structure');
  const tabParam = searchParams.get('tab');

  // Selected Location & Structure states
  const [selectedLocationId, setSelectedLocationId] = useState<string>(() => {
    if (tabParam === 'chopper' || structureParam === 'struct_gas_station_chopper') return 'gas_station';
    if (structureParam) {
      const found = structures.find((s) => s.id === structureParam);
      if (found) return found.locationId;
    }
    if (locationParam) return locationParam;
    return 'gas_station';
  });

  const [selectedStructureId, setSelectedStructureId] = useState<string>(() => {
    if (tabParam === 'chopper' || structureParam === 'struct_gas_station_chopper') return 'struct_gas_station_chopper';
    if (structureParam && structures.some((s) => s.id === structureParam)) return structureParam;
    return '';
  });

  // Modal open state
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // One-time Construction calculator states
  const [stageIds, setStageIds] = useState<string[]>([]);
  const [available, setAvailable] = useState<Record<string, number>>({});
  const [includeCrafting, setIncludeCrafting] = useState(true);

  // Chopper calculator states
  const [chopperLevel, setChopperLevel] = useState<number>(42);
  const [chopperExp, setChopperExp] = useState<number>(3610);
  const [donations, setDonations] = useState<Record<string, number>>({});

  // Sync selection with URL params
  useEffect(() => {
    if (tabParam === 'chopper' || structureParam === 'struct_gas_station_chopper') {
      setSelectedLocationId('gas_station');
      setSelectedStructureId('struct_gas_station_chopper');
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
      const matching = structures.filter((s) => s.locationId === firstLoc);
      setSelectedStructureId(matching[0]?.id ?? '');
    }
  }, [locationParam, structureParam, tabParam, structures, locationsWithStructures]);

  // Structures available at the selected location
  const structuresForLocation = useMemo(
    () => structures.filter((s) => s.locationId === selectedLocationId),
    [structures, selectedLocationId]
  );

  // Active structure
  const structure = useMemo(() => {
    return (
      structuresForLocation.find((s) => s.id === selectedStructureId) ||
      structuresForLocation[0] ||
      structures[0]
    );
  }, [structuresForLocation, selectedStructureId, structures]);

  // Update selected structure ID if current is not in the location
  useEffect(() => {
    if (structuresForLocation.length > 0) {
      if (!structuresForLocation.some((s) => s.id === selectedStructureId)) {
        setSelectedStructureId(structuresForLocation[0].id);
      }
    }
  }, [structuresForLocation, selectedStructureId]);

  // When structure changes, reset selected stages
  useEffect(() => {
    if (structure?.stages && structure.stages.length > 0) {
      setStageIds(structure.stages.map((s) => s.id));
    } else {
      setStageIds([]);
    }
  }, [structure]);

  // Handle location change
  const handleLocationChange = (newLocId: string) => {
    setSelectedLocationId(newLocId);
    const matching = structures.filter((s) => s.locationId === newLocId);
    const firstId = matching[0]?.id ?? '';
    setSelectedStructureId(firstId);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('location', newLocId);
    if (firstId) nextParams.set('structure', firstId);
    nextParams.delete('tab');
    setSearchParams(nextParams, { replace: true });
  };

  // Handle structure change
  const handleStructureChange = (newStructId: string) => {
    setSelectedStructureId(newStructId);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('structure', newStructId);
    nextParams.delete('tab');
    setSearchParams(nextParams, { replace: true });
  };

  const selectedLocation = db?.locationsMap.get(selectedLocationId);
  const isChopper = structure?.id === 'struct_gas_station_chopper' || structure?.frequency === 'recurring';

  // Toggle stage selection for construction calculation
  const toggleStage = (id: string) =>
    setStageIds((prev) => {
      if (!prev.includes(id)) return [...prev, id];
      return prev.length > 1 ? prev.filter((s) => s !== id) : prev;
    });

  // Calculate construction result
  const constructionResult = useMemo(() => {
    if (!structure || !db || isChopper || stageIds.length === 0) return null;
    return calculateConstructionRequirements({
      structure,
      stageIds,
      availableMaterials: available,
      itemsMap: db.itemsMap,
      recipesByOutput: db.recipesByOutputMap,
      includeCraftingBreakdown: includeCrafting,
    });
  }, [structure, stageIds, available, includeCrafting, db, isChopper]);

  // Chopper upgrade calculations
  const acceptedItems = structure?.cycleConfig?.acceptedItems ?? DEFAULT_CHOPPER_ACCEPTED_ITEMS;
  const perkGuide = structure?.cycleConfig?.perkGuide ?? [
    {
      name: 'Trunk Capacity (Mở rộng cốp xe)',
      tier: 'S',
      description: 'Mở rộng thêm số ô chứa đồ trong cốp xe máy (tối đa 8 ô). Đây là ưu tiên số 1 tuyệt đối!',
    },
    {
      name: 'Fuel Economy (Tiết kiệm xăng)',
      tier: 'A',
      description: 'Giảm lượng xăng tiêu thụ khi di chuyển trên bản đồ thế giới, giúp tiết kiệm tài nguyên xăng đáng kể.',
    },
    {
      name: 'Fuel Tank (Dung tích bình xăng)',
      tier: 'B',
      description: 'Tăng lượng xăng tối đa có thể chứa trong bình xe máy, tiện lợi cho các hành trình dài ngày.',
    },
    {
      name: 'Impact Power (Sát thương đâm tông)',
      tier: 'C',
      description: 'Tăng sát thương khi lái xe húc vào zombie (ít khi dùng vì vừa hao xăng vừa hỏng xe).',
    },
  ];

  const chopperRequiredExp = getChopperRequiredExp(chopperLevel);
  const chopperExpPercent =
    chopperRequiredExp > 0 ? Math.min(100, Math.round((chopperExp / chopperRequiredExp) * 100)) : 100;

  const chopperResult = useMemo(
    () =>
      calculateChopperUpgrade({
        currentLevel: chopperLevel,
        currentExp: chopperExp,
        donations,
        acceptedItems,
      }),
    [chopperLevel, chopperExp, donations, acceptedItems]
  );

  const handleDonationChange = (itemId: string, value: number, dailyLimit?: number) => {
    const capped = dailyLimit ? Math.max(0, Math.min(dailyLimit, value)) : Math.max(0, value);
    setDonations((prev) => {
      const next = { ...prev };
      if (capped > 0) {
        next[itemId] = capped;
      } else {
        delete next[itemId];
      }
      return next;
    });
  };

  const handleMaxItem = (itemId: string, dailyLimit?: number) => {
    if (dailyLimit) {
      handleDonationChange(itemId, dailyLimit, dailyLimit);
    }
  };

  const handleSelectOptimalJunk = () => {
    const junkCombo = getOptimalJunkCombo(acceptedItems);
    setDonations(junkCombo);
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Công trình & Nâng cấp"
        description="Tra cứu nguyên liệu cần nộp theo từng địa điểm và mở máy tính kiểm tra tiến độ khi cần."
        icon={<Building2 />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Location & Structure Selector                */}
        {/* ========================================================= */}
        <div className="space-y-4 lg:col-span-4">
          <Card className="space-y-4">
            <Field label="1. Chọn Địa điểm">
              <Select
                value={selectedLocationId}
                onChange={(e) => handleLocationChange(e.target.value)}
              >
                {locationsWithStructures.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.vietnameseName ? `${loc.vietnameseName} (${loc.name})` : loc.name}
                  </option>
                ))}
              </Select>
            </Field>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  2. Chỗ cần nộp / Hạng mục
                </label>
                <span className="text-xs text-muted font-mono">
                  {structuresForLocation.length} chỗ
                </span>
              </div>

              <div className="space-y-2">
                {structuresForLocation.map((s) => {
                  const isSelected = s.id === structure?.id;
                  const isItemRecurring = s.frequency === 'recurring';

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleStructureChange(s.id)}
                      className={`w-full text-left rounded-lg p-3 transition-all border flex items-start gap-3 ${
                        isSelected
                          ? 'border-accent bg-accent/10 shadow-sm ring-1 ring-accent/40'
                          : 'border-line bg-surface hover:bg-subtle'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isItemRecurring ? (
                          <Bike className={`h-4 w-4 ${isSelected ? 'text-accent' : 'text-muted'}`} />
                        ) : (
                          <Building2 className={`h-4 w-4 ${isSelected ? 'text-accent' : 'text-muted'}`} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-sm font-semibold truncate ${
                              isSelected ? 'text-fg' : 'text-muted'
                            }`}
                          >
                            {s.vietnameseName || s.name}
                          </span>
                          <Badge size="sm" tone={isItemRecurring ? 'accent' : 'neutral'}>
                            {isItemRecurring ? 'Nâng cấp' : '1 lần'}
                          </Badge>
                        </div>
                        {s.description && (
                          <p className="text-xs text-muted line-clamp-2 mt-1 leading-relaxed">
                            {s.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedLocation && (
              <div className="rounded-lg border border-line bg-subtle/30 p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-fg">Thông tin địa điểm:</span>
                  <Link
                    to={`/wiki/locations?select=${selectedLocation.id}`}
                    className="text-accent font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    Xem bản đồ
                  </Link>
                </div>
                {selectedLocation.description && (
                  <p className="text-muted leading-relaxed">{selectedLocation.description}</p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Wiki Details of Materials to Put In        */}
        {/* ========================================================= */}
        <div className="space-y-4 lg:col-span-8">
          {structure && (
            <Card className="space-y-4">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-fg">
                      {structure.vietnameseName || structure.name}
                    </h2>
                    <Badge tone={isChopper ? 'accent' : 'info'}>
                      {isChopper ? 'Nâng cấp định kỳ (Chu kỳ 24h)' : 'Công trình cố định (Sửa 1 lần)'}
                    </Badge>
                  </div>
                  {structure.vietnameseName && (
                    <p className="text-xs text-muted mt-0.5">{structure.name}</p>
                  )}
                </div>

                <Button
                  variant="primary"
                  onClick={() => setIsCalculatorOpen(true)}
                  className="shrink-0 flex items-center gap-2 shadow-sm"
                >
                  <Calculator className="h-4 w-4" />
                  <span>
                    {isChopper ? 'Mở máy tính nâng cấp Chopper' : 'Mở máy tính nguyên liệu'}
                  </span>
                </Button>
              </div>

              {/* Description */}
              {structure.description && (
                <p className="text-sm text-muted leading-relaxed">{structure.description}</p>
              )}

              {/* Badges for unlocks & notes */}
              {(structure.unlocks?.length || structure.notes) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {structure.unlocks && structure.unlocks.length > 0 && (
                    <div className="rounded-lg border border-line bg-subtle/40 p-3">
                      <span className="text-xs font-semibold text-muted block mb-1.5">
                        Phần thưởng mở khóa:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {structure.unlocks.map((u) => (
                          <Badge key={u} tone="ok" size="sm">
                            <Check className="h-3 w-3" />
                            {u}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {structure.notes && (
                    <div className="rounded-lg border border-line bg-subtle/40 p-3">
                      <span className="text-xs font-semibold text-muted block mb-1">
                        Ghi chú hữu ích:
                      </span>
                      <p className="text-xs text-muted leading-relaxed">{structure.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* WIKI CONTENT: CASE 1 - RECURRING CHOPPER WORKSHOP        */}
              {/* ========================================================= */}
              {isChopper ? (
                <div className="space-y-5 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
                        <Bike className="h-4 w-4 text-accent" />
                        Danh sách nguyên liệu Jane nhận nộp lấy EXP
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        Bảng quy đổi điểm EXP mỗi đơn vị và mức hạn ngạch mỗi ngày.
                      </p>
                    </div>
                    <Badge tone="info">Reset mỗi 24h</Badge>
                  </div>

                  <div className="rounded-xl border border-line overflow-hidden">
                    <Table>
                        <Thead>
                            <Th>Vật phẩm</Th>
                            <Th align="right">EXP / món</Th>
                            <Th align="center">Hạn mức / ngày</Th>
                            <Th>Gợi ý</Th>
                            <Th>Lý do & Lưu ý</Th>
                          </Thead>
                        <Tbody>
                          {acceptedItems.map((item) => {
                            const itemMeta = db.itemsMap.get(item.itemId);
                            const itemName = itemMeta?.vietnameseName || itemMeta?.name || item.itemId;
                            const isRec = item.tier === 'recommended';
                            const isAvoid = item.tier === 'avoid';

                            return (
                              <Tr key={item.itemId}>
                                <Td>
                                  <div className="flex items-center gap-2.5">
                                    <div className="h-9 w-9 shrink-0 rounded-md border border-line bg-surface p-1">
                                      <EntityImage folder="items" id={item.itemId} alt={itemName} compact />
                                    </div>
                                    <div>
                                      <Link
                                        to={`/wiki/items?select=${item.itemId}`}
                                        className="font-medium hover:text-accent hover:underline block"
                                      >
                                        {itemName}
                                      </Link>
                                      {itemMeta?.category && (
                                        <span className="text-2xs text-muted">
                                          {ITEM_CATEGORY_LABEL[itemMeta.category as keyof typeof ITEM_CATEGORY_LABEL] ??
                                            itemMeta.category}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </Td>
                                <Td align="right" numeric className="font-bold text-accent">
                                  +{item.valuePerItem} EXP
                                </Td>
                                <Td align="center" className="text-xs text-muted">
                                  {item.dailyLimit ? `${item.dailyLimit}` : 'Không giới hạn'}
                                </Td>
                                <Td>
                                  <Badge tone={isRec ? 'ok' : isAvoid ? 'neutral' : 'warn'} size="sm">
                                    {isRec ? 'Khuyên dùng' : isAvoid ? 'Giữ lại chế đồ' : 'Cân nhắc'}
                                  </Badge>
                                </Td>
                                <Td className="text-xs text-muted leading-relaxed">
                                  {item.reason}
                                </Td>
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                  </div>

                  {/* Chopper Perks Guide */}
                  <div className="rounded-xl border border-line bg-subtle/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-accent" />
                        <h4 className="text-sm font-semibold text-fg">
                          Thứ tự ưu tiên kỹ năng Chopper (Perk Guide)
                        </h4>
                      </div>
                      <Badge tone="neutral">Tham khảo</Badge>
                    </div>
                    <p className="text-xs text-muted">
                      Mỗi khi lên cấp, bạn nhận được lượt quay ngẫu nhiên 3 kỹ năng để chọn 1.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {perkGuide.map((perk) => (
                        <div key={perk.name} className="rounded-lg border border-line bg-surface p-2.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold">{perk.name}</span>
                            <Badge
                              tone={
                                perk.tier === 'S'
                                  ? 'accent'
                                  : perk.tier === 'A'
                                  ? 'ok'
                                  : perk.tier === 'B'
                                  ? 'info'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              Hạng {perk.tier}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted leading-relaxed">{perk.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* ========================================================= */
                /* WIKI CONTENT: CASE 2 - ONE-TIME CONSTRUCTION STAGES      */
                /* ========================================================= */
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
                        <Layers className="h-4 w-4 text-accent" />
                        Danh sách nguyên liệu cần bỏ vào
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        Liệt kê theo từng giai đoạn hoàn thiện của công trình.
                      </p>
                    </div>
                    <span className="text-xs text-muted font-mono">
                      {structure.stages.length} giai đoạn
                    </span>
                  </div>

                  {structure.stages.map((stage, idx) => (
                    <div key={stage.id} className="rounded-xl border border-line overflow-hidden">
                      <div className="bg-subtle/60 px-4 py-2.5 border-b border-line flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {structure.stages.length > 1 ? `Giai đoạn ${idx + 1}: ${stage.name}` : stage.name}
                        </span>
                        <span className="text-xs text-muted font-mono">
                          {stage.requirements.reduce((sum, r) => sum + r.quantity, 0)} món
                        </span>
                      </div>

                      <Table>
                          <Thead>
                              <Th>Vật phẩm</Th>
                              <Th align="right">Số lượng cần</Th>
                              <Th>Cách kiếm / Chế tạo</Th>
                            </Thead>
                          <Tbody>
                            {stage.requirements.length === 0 ? (
                              <Tr>
                                <Td align="center" colSpan={3} className="text-xs text-muted">
                                  Không yêu cầu vật phẩm nộp vào (ví dụ: thao tác mở khóa hoặc nhập mã).
                                </Td>
                              </Tr>
                            ) : (
                              stage.requirements.map((req) => {
                                const item = db.itemsMap.get(req.itemId);
                                const itemName = item?.vietnameseName || item?.name || req.itemId;

                                return (
                                  <Tr key={req.itemId}>
                                    <Td>
                                      <div className="flex items-center gap-2.5">
                                        <div className="h-9 w-9 shrink-0 rounded-md border border-line bg-surface p-1">
                                          <EntityImage folder="items" id={req.itemId} alt={itemName} compact />
                                        </div>
                                        <div>
                                          <Link
                                            to={`/wiki/items?select=${req.itemId}`}
                                            className="font-medium hover:text-accent hover:underline block"
                                          >
                                            {itemName}
                                          </Link>
                                          {item?.category && (
                                            <span className="text-2xs text-muted">
                                              {ITEM_CATEGORY_LABEL[
                                                item.category as keyof typeof ITEM_CATEGORY_LABEL
                                              ] ?? item.category}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </Td>
                                    <Td align="right" numeric className="font-bold text-base text-fg">
                                      {req.quantity}
                                    </Td>
                                    <Td className="text-xs text-muted">
                                      {item?.craftable ? (
                                        <Link
                                          to={`/planner?item=${req.itemId}&qty=${req.quantity}`}
                                          className="text-accent hover:underline inline-flex items-center gap-1 font-medium"
                                        >
                                          <Wrench className="h-3 w-3" />
                                          <span>Chế tạo được (Bấm xem công thức)</span>
                                        </Link>
                                      ) : (
                                        <span>Nhặt trong rương game / sự kiện</span>
                                      )}
                                    </Td>
                                  </Tr>
                                );
                              })
                            )}
                          </Tbody>
                        </Table>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* POPUP MODAL: CALCULATOR DIALOG                            */}
      {/* ========================================================= */}
      <Modal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-accent" />
            <span>
              {isChopper
                ? 'Máy tính nâng cấp xe Chopper (Jane)'
                : `Tính toán nguyên liệu: ${structure?.vietnameseName || structure?.name}`}
            </span>
          </div>
        }
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            {isChopper ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDonations({})}
                className="text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Đặt lại số lượng
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAvailable({})}
                className="text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Đặt lại số có sẵn
              </Button>
            )}

            <Button variant="primary" size="sm" onClick={() => setIsCalculatorOpen(false)}>
              Hoàn tất
            </Button>
          </div>
        }
      >
        {isChopper ? (
          /* ======================================================= */
          /* POPUP CONTENT: CHOPPER UPGRADE CALCULATOR               */
          /* ======================================================= */
          <div className="space-y-4">
            {/* Top Bike Status Inputs */}
            <div className="rounded-xl border border-line bg-subtle/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Cấp độ xe hiện tại</span>
                <Badge tone="accent">Cấp 1 - 100</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Cấp độ xe hiện tại">
                  <NumberInput
                    min={1}
                    max={100}
                    value={chopperLevel}
                    onValueChange={(val) => {
                      const l = Math.max(1, Math.min(100, val));
                      setChopperLevel(l);
                      setChopperExp((prev) => Math.min(prev, getChopperRequiredExp(l)));
                    }}
                  />
                </Field>

                <Field
                  label="EXP hiện tại"
                  hint={`Cần ${chopperRequiredExp.toLocaleString()} EXP để lên cấp`}
                >
                  <NumberInput
                    min={0}
                    max={chopperRequiredExp}
                    value={chopperExp}
                    onValueChange={(val) => setChopperExp(Math.max(0, Math.min(chopperRequiredExp, val)))}
                  />
                </Field>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted">
                  <span>Tiến trình cấp hiện tại</span>
                  <span>
                    {chopperExp.toLocaleString()} / {chopperRequiredExp.toLocaleString()} EXP ({chopperExpPercent}%)
                  </span>
                </div>
                <ProgressBar percent={chopperExpPercent} tone="accent" />
              </div>
            </div>

            {/* Results Overview */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Kết quả dự kiến sau khi nộp</h4>
                {chopperResult.levelsGained > 0 && (
                  <Badge tone="ok">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    +{chopperResult.levelsGained} Cấp độ
                  </Badge>
                )}
              </div>

              <StatGrid cols={3}>
                <Stat
                  label="Tổng EXP nộp"
                  value={`+${chopperResult.totalExpGained.toLocaleString()}`}
                  tone="accent"
                  unit="EXP"
                />
                <Stat
                  label="Cấp dự kiến"
                  value={`Lv. ${chopperResult.newLevel}`}
                  tone={chopperResult.levelsGained > 0 ? 'ok' : 'neutral'}
                  hint={chopperResult.levelsGained > 0 ? `Tăng +${chopperResult.levelsGained} cấp` : 'Chưa lên cấp'}
                />
                <Stat
                  label={chopperResult.isLevelUpSatisfied ? 'Trạng thái' : 'Còn thiếu'}
                  value={
                    chopperResult.isLevelUpSatisfied
                      ? 'Đủ lên cấp'
                      : `${chopperResult.remainingExpToNextLevel.toLocaleString()}`
                  }
                  tone={chopperResult.isLevelUpSatisfied ? 'ok' : 'neutral'}
                  unit={chopperResult.isLevelUpSatisfied ? undefined : 'EXP'}
                />
              </StatGrid>

              {chopperResult.levelsGained > 0 ? (
                <Callout tone="ok">
                  <div className="text-xs">
                    Tăng từ <strong>Lv. {chopperResult.currentLevel}</strong> lên{' '}
                    <strong>Lv. {chopperResult.newLevel}</strong>! Bạn sẽ nhận được{' '}
                    <strong>{chopperResult.perkRollsAvailable}</strong> lượt chọn kỹ năng mới.
                  </div>
                </Callout>
              ) : (
                <Callout tone="info">
                  <div className="text-xs">
                    Còn thiếu <strong>{chopperResult.remainingExpToNextLevel.toLocaleString()} EXP</strong> nữa để đạt cấp{' '}
                    {chopperResult.currentLevel + 1}.
                  </div>
                </Callout>
              )}
            </Card>

            {/* Donation Inputs Grid */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold">Nhập số lượng đồ dự kiến nộp</h4>
                  <p className="text-xs text-muted">
                    Bấm &quot;Gợi ý combo&quot; để điền nhanh các món rác thừa thông dụng.
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSelectOptimalJunk}
                  className="text-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  Gợi ý combo tiết kiệm
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {acceptedItems.map((item) => {
                  const itemMeta = db.itemsMap.get(item.itemId);
                  const itemName = itemMeta?.vietnameseName || itemMeta?.name || item.itemId;
                  const currentDonation = donations[item.itemId] ?? 0;
                  const isRecommended = item.tier === 'recommended';

                  return (
                    <div
                      key={item.itemId}
                      className={`flex flex-col justify-between rounded-lg border p-2.5 transition-colors ${
                        currentDonation > 0
                          ? 'border-accent-solid/60 bg-accent-soft/20'
                          : 'border-line bg-subtle/40 hover:bg-subtle'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="h-10 w-10 shrink-0 rounded-md border border-line bg-surface p-1">
                          <EntityImage folder="items" id={item.itemId} alt={itemName} compact />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate text-xs font-semibold" title={itemName}>
                              {itemName}
                            </span>
                            {isRecommended && (
                              <Badge tone="ok" size="sm">
                                Tiết kiệm
                              </Badge>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-2xs text-muted">
                            <span className="font-semibold text-accent">+{item.valuePerItem} EXP</span>
                            <span>·</span>
                            <span>{item.dailyLimit ? `Tối đa ${item.dailyLimit}` : 'Vô hạn'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="min-w-0 flex-1">
                          <NumberInput
                            min={0}
                            max={item.dailyLimit}
                            value={currentDonation}
                            onValueChange={(val) => handleDonationChange(item.itemId, val, item.dailyLimit)}
                            className="h-8 text-xs"
                            placeholder="0"
                          />
                        </div>
                        {item.dailyLimit && (
                          <Button
                            variant={currentDonation === item.dailyLimit ? 'primary' : 'secondary'}
                            size="sm"
                            className="h-8 px-2.5 text-xs shrink-0"
                            onClick={() => handleMaxItem(item.itemId, item.dailyLimit)}
                          >
                            Max
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================= */
          /* POPUP CONTENT: ONE-TIME CONSTRUCTION CALCULATOR         */
          /* ======================================================= */
          <div className="space-y-4">
            {/* Stage checkboxes & Crafting analysis option */}
            <div className="rounded-xl border border-line bg-subtle/30 p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Giai đoạn tính toán:
                </span>
                <Checkbox
                  checked={includeCrafting}
                  onChange={setIncludeCrafting}
                  label="Phân tích nguyên liệu thô"
                  hint="Liệt kê nguyên liệu cơ bản nhất nếu tự chế"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {structure?.stages.map((stage) => (
                  <ToggleChip key={stage.id} checked={stageIds.includes(stage.id)} onChange={() => toggleStage(stage.id)}>
                    {stage.name}
                  </ToggleChip>
                ))}
              </div>
            </div>

            {/* Construction Progress Card */}
            {constructionResult && (
              <>
                <Card className="space-y-3" selected={constructionResult.allSatisfied}>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="eyebrow">Tiến độ chuẩn bị</p>
                      <p className="num text-2xl font-semibold">
                        {constructionResult.completionPercent}%
                      </p>
                    </div>
                    {constructionResult.allSatisfied && (
                      <Badge tone="ok" size="md">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Đã đủ nguyên liệu
                      </Badge>
                    )}
                  </div>

                  <ProgressBar
                    percent={constructionResult.completionPercent}
                    tone={constructionResult.allSatisfied ? 'ok' : 'accent'}
                  />

                  <StatGrid cols={3}>
                    <Stat label="Loại vật phẩm" value={constructionResult.totalUniqueItems} />
                    <Stat label="Tổng số lượng" value={constructionResult.totalItemsCount} />
                    <Stat
                      label="Còn thiếu"
                      value={constructionResult.materials.filter((m) => !m.isSatisfied).length}
                      unit="loại"
                      tone={constructionResult.allSatisfied ? 'ok' : 'danger'}
                    />
                  </StatGrid>
                </Card>

                {/* Materials Inputs Table */}
                <Card padded={false}>
                  <div className="px-4 pt-3.5 pb-2">
                    <h4 className="text-sm font-semibold">Nhập số bạn đang có</h4>
                    <p className="text-xs text-muted">
                      Nhập số lượng trong rương đồ của bạn để kiểm tra còn thiếu bao nhiêu.
                    </p>
                  </div>

                  <Table>
                      <Thead>
                          <Th>Vật phẩm</Th>
                          <Th align="right">Cần</Th>
                          <Th align="center">Đang có</Th>
                          <Th align="right">Thiếu</Th>
                          <Th>Cách có</Th>
                        </Thead>
                      <Tbody>
                        {constructionResult.materials.map((mat) => (
                          <Tr key={mat.itemId} className="align-top">
                            <Td>
                              <div className="font-medium text-fg">{mat.itemName}</div>
                              {mat.byStage.length > 1 && (
                                <div className="text-2xs text-muted">
                                  {mat.byStage.map((s) => `${s.stageName}: ${s.quantity}`).join(' · ')}
                                </div>
                              )}
                            </Td>
                            <Td align="right" numeric className="font-semibold">
                              {mat.totalRequired}
                            </Td>
                            <Td>
                              <NumberInput
                                aria-label={`Số ${mat.itemName} đang có`}
                                value={mat.availableInHand || undefined}
                                placeholder="0"
                                onValueChange={(v) =>
                                  setAvailable((prev) => ({
                                    ...prev,
                                    [mat.itemId]: Math.max(0, Math.floor(v)),
                                  }))
                                }
                                className="mx-auto h-8 w-20 text-center text-xs"
                              />
                            </Td>
                            <Td align="right" numeric className="font-semibold">
                              {mat.isSatisfied ? (
                                <span className="text-ok">Đủ</span>
                              ) : (
                                <span className="text-danger">{mat.missing}</span>
                              )}
                            </Td>
                            <Td className="text-xs text-muted">
                              {mat.isSatisfied ? (
                                '—'
                              ) : mat.craftingPlan && mat.craftingPlan.intermediateSteps.length > 0 ? (
                                <Link
                                  to={`/planner?item=${mat.itemId}&qty=${mat.missing}`}
                                  className="text-accent hover:underline inline-flex items-center gap-1 font-medium"
                                >
                                  <Wrench className="h-3 w-3 shrink-0" />
                                  <span>Chế từ nguyên liệu</span>
                                </Link>
                              ) : (
                                'Nhặt trong game'
                              )}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                </Card>

                {/* Raw Materials Breakdown if enabled */}
                {includeCrafting && (
                  <div className="rounded-xl border border-line bg-subtle/30 p-3.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-accent" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-fg">
                        Phân tích nguyên liệu thô cần gom
                      </h4>
                    </div>
                    <Table scroll={false}>
                        <Thead>
                            <Th>Nguyên liệu thô</Th>
                            <Th align="right">Tổng cần</Th>
                          </Thead>
                        <Tbody>
                          {(() => {
                            const rawTotals: Record<string, number> = {};
                            constructionResult.materials.forEach((mat) => {
                              if (mat.craftingPlan && mat.craftingPlan.totalRawMaterials.length > 0) {
                                mat.craftingPlan.totalRawMaterials.forEach((raw) => {
                                  rawTotals[raw.itemId] = (rawTotals[raw.itemId] || 0) + raw.required;
                                });
                              }
                            });

                            const entries = Object.entries(rawTotals);
                            if (entries.length === 0) {
                              return (
                                <Tr>
                                  <Td align="center" colSpan={2} className="text-muted">
                                    Không có vật phẩm nào cần chế tạo phức tạp.
                                  </Td>
                                </Tr>
                              );
                            }

                            return entries.map(([itemId, total]) => {
                              const item = db.itemsMap.get(itemId);
                              return (
                                <Tr key={itemId}>
                                  <Td>
                                    <Link
                                      to={`/wiki/items?select=${itemId}`}
                                      className="text-accent hover:underline font-medium"
                                    >
                                      {item?.name ?? itemId}
                                    </Link>
                                  </Td>
                                  <Td align="right" numeric className="font-semibold">{total}</Td>
                                </Tr>
                              );
                            });
                          })()}
                        </Tbody>
                      </Table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
