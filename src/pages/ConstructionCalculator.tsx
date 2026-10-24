import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, CheckCircle2, Layers } from 'lucide-react';
import { useGameData } from '../context/DataContext';
import { calculateConstructionRequirements } from '../lib/calculators/constructionCalculator';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Checkbox, Field, NumberInput, Select } from '../components/common/Field';
import { EmptyState, PageHeader, ProgressBar, Section, Stat, StatGrid } from '../components/common/Layout';
import { ITEM_CATEGORY_LABEL } from '../lib/labels';

export const ConstructionCalculator: React.FC = () => {
  const { db } = useGameData();
  const [searchParams] = useSearchParams();

  const structures = db?.locationStructures ?? [];
  const [structureId, setStructureId] = useState('');
  const [stageIds, setStageIds] = useState<string[]>([]);
  const [available, setAvailable] = useState<Record<string, number>>({});
  const [includeCrafting, setIncludeCrafting] = useState(true);

  // ?structure=... links (wiki, global search) pick the structure, even when this page is already open.
  const structureParam = searchParams.get('structure');
  useEffect(() => {
    setStructureId((current) => {
      if (structureParam && structures.some((s) => s.id === structureParam)) return structureParam;
      return structures.some((s) => s.id === current) ? current : structures[0]?.id ?? '';
    });
  }, [structureParam, structures]);

  const structure = structures.find((s) => s.id === structureId);

  // A new structure starts with all of its stages selected.
  useEffect(() => {
    setStageIds(structure?.stages.map((s) => s.id) ?? []);
  }, [structure]);

  const toggleStage = (id: string) =>
    setStageIds((prev) => {
      if (!prev.includes(id)) return [...prev, id];
      return prev.length > 1 ? prev.filter((s) => s !== id) : prev; // keep at least one stage
    });

  const result = useMemo(() => {
    if (!structure || !db || stageIds.length === 0) return null;
    return calculateConstructionRequirements({
      structure,
      stageIds,
      availableMaterials: available,
      itemsMap: db.itemsMap,
      recipesByOutput: db.recipesByOutputMap,
      includeCraftingBreakdown: includeCrafting,
    });
  }, [structure, stageIds, available, includeCrafting, db]);

  const location = structure ? db?.locationsMap.get(structure.locationId) : undefined;

  if (!db || structures.length === 0) {
    return (
      <div>
        <PageHeader title="Vật liệu công trình" icon={<Building2 />} />
        <EmptyState icon={<Building2 />} title="Chưa có công trình nào" description="Thêm công trình vào locationStructures.json để dùng máy tính này." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Vật liệu công trình"
        description="Tổng hợp nguyên liệu theo giai đoạn cho tháp canh, cầu, bunker... và xem còn thiếu bao nhiêu."
        icon={<Building2 />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <Card className="space-y-4">
            <Field label="Công trình">
              <Select value={structureId} onChange={(e) => setStructureId(e.target.value)}>
                {structures.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            {structure?.description && <p className="text-sm text-muted">{structure.description}</p>}
            {location && (
              <p className="text-sm text-muted">
                Địa điểm:{' '}
                <Link to={`/wiki/locations?select=${location.id}`} className="font-medium text-accent hover:underline">
                  {location.name}
                </Link>
              </p>
            )}

            <Section title="Giai đoạn cần tính" description="Giữ ít nhất một giai đoạn.">
              <ul className="space-y-1.5">
                {structure?.stages.map((stage) => (
                  <li key={stage.id}>
                    <Checkbox checked={stageIds.includes(stage.id)} onChange={() => toggleStage(stage.id)} label={stage.name} />
                  </li>
                ))}
              </ul>
            </Section>

            <Checkbox
              checked={includeCrafting}
              onChange={setIncludeCrafting}
              label="Phân tích nguyên liệu thô"
              hint="Với vật phẩm chế được, liệt kê cả nguyên liệu để chế."
            />
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-8">
          {result && (
            <>
              <Card className="space-y-3" selected={result.allSatisfied}>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="eyebrow">Tiến độ chuẩn bị</p>
                    <p className="num text-2xl font-semibold">{result.completionPercent}%</p>
                  </div>
                  {result.allSatisfied && (
                    <Badge tone="ok" size="md">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Đã đủ nguyên liệu
                    </Badge>
                  )}
                </div>
                <ProgressBar percent={result.completionPercent} tone={result.allSatisfied ? 'ok' : 'accent'} />
                <StatGrid cols={3}>
                  <Stat label="Loại vật phẩm" value={result.totalUniqueItems} />
                  <Stat label="Tổng số lượng" value={result.totalItemsCount} />
                  <Stat label="Còn thiếu" value={result.materials.filter((m) => !m.isSatisfied).length} unit="loại" tone={result.allSatisfied ? 'ok' : 'danger'} />
                </StatGrid>
              </Card>

              <Card padded={false}>
                <div className="px-4 pt-4">
                  <h2 className="text-sm font-semibold">Nguyên liệu cần có</h2>
                  <p className="text-xs text-muted">Nhập số bạn đang có để tính phần còn thiếu.</p>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="border-y border-line text-xs text-muted">
                        <th className="px-4 py-2 font-medium">Vật phẩm</th>
                        <th className="px-2 py-2 text-right font-medium">Cần</th>
                        <th className="px-2 py-2 text-center font-medium">Đang có</th>
                        <th className="px-2 py-2 text-right font-medium">Thiếu</th>
                        <th className="px-4 py-2 font-medium">Cách có</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {result.materials.map((mat) => (
                        <tr key={mat.itemId} className="align-top">
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-1.5 font-medium">
                              {mat.itemName}
                              {mat.category && <Badge>{ITEM_CATEGORY_LABEL[mat.category as keyof typeof ITEM_CATEGORY_LABEL] ?? mat.category}</Badge>}
                            </div>
                            {mat.byStage.length > 1 && (
                              <div className="mt-0.5 text-xs text-faint">
                                {mat.byStage.map((s) => `${s.stageName}: ${s.quantity}`).join(' · ')}
                              </div>
                            )}
                          </td>
                          <td className="num px-2 py-3 text-right font-semibold">{mat.totalRequired}</td>
                          <td className="px-2 py-3">
                            <NumberInput
                              aria-label={`Số ${mat.itemName} đang có`}
                              value={mat.availableInHand || undefined}
                              placeholder="0"
                              onValueChange={(v) => setAvailable((prev) => ({ ...prev, [mat.itemId]: Math.max(0, Math.floor(v)) }))}
                              className="mx-auto h-8 w-20 text-center"
                            />
                          </td>
                          <td className="num px-2 py-3 text-right font-semibold">
                            {mat.isSatisfied ? <span className="text-ok">Đủ</span> : <span className="text-danger">{mat.missing}</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted">
                            {mat.isSatisfied ? (
                              '—'
                            ) : mat.craftingPlan && mat.craftingPlan.intermediateSteps.length > 0 ? (
                              <Link
                                to={`/planner?item=${mat.itemId}&qty=${mat.missing}`}
                                className="inline-flex items-start gap-1 font-medium text-accent hover:underline"
                              >
                                <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>
                                  Chế từ{' '}
                                  {mat.craftingPlan.totalRawMaterials
                                    .filter((r) => r.missing > 0)
                                    .map((r) => `${r.itemName} ×${r.missing}`)
                                    .join(', ') || 'nguyên liệu đang có'}
                                </span>
                              </Link>
                            ) : (
                              'Nhặt trong game / sự kiện'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
