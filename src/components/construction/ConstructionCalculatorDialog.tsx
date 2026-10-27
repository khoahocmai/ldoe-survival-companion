import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, CheckCircle2, Layers, RotateCcw, Wrench } from 'lucide-react';
import { LocationStructure } from '../../types';
import { useGameData } from '../../context/DataContext';
import { calculateConstructionRequirements } from '../../lib/calculators/constructionCalculator';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Checkbox, NumberInput } from '../common/Field';
import { ProgressBar, Stat, StatGrid, ToggleChip } from '../common/Layout';
import { Modal } from '../common/Modal';
import { Table, Tbody, Td, Th, Thead, Tr } from '../common/Table';

interface ConstructionCalculatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  structure: LocationStructure;
}

/** Checks which materials are still missing for the chosen stages, optionally down to raw resources. */
export const ConstructionCalculatorDialog: React.FC<ConstructionCalculatorDialogProps> = ({
  isOpen,
  onClose,
  structure,
}) => {
  const { db } = useGameData();
  const [stageIds, setStageIds] = useState<string[]>([]);
  const [available, setAvailable] = useState<Record<string, number>>({});
  const [includeCrafting, setIncludeCrafting] = useState(true);

  // A different structure starts with all of its stages selected.
  useEffect(() => {
    setStageIds(structure.stages.map((s) => s.id));
  }, [structure]);

  // At least one stage always stays selected.
  const toggleStage = (id: string) =>
    setStageIds((prev) => {
      if (!prev.includes(id)) return [...prev, id];
      return prev.length > 1 ? prev.filter((s) => s !== id) : prev;
    });

  const result = useMemo(() => {
    if (!db || stageIds.length === 0) return null;
    return calculateConstructionRequirements({
      structure,
      stageIds,
      availableMaterials: available,
      itemsMap: db.itemsMap,
      recipesByOutput: db.recipesByOutputMap,
      includeCraftingBreakdown: includeCrafting,
    });
  }, [db, structure, stageIds, available, includeCrafting]);

  const rawTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    result?.materials.forEach((mat) => {
      mat.craftingPlan?.totalRawMaterials.forEach((raw) => {
        totals[raw.itemId] = (totals[raw.itemId] || 0) + raw.required;
      });
    });
    return Object.entries(totals);
  }, [result]);

  if (!db) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <span className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-accent" />
          Tính toán nguyên liệu: {structure.vietnameseName || structure.name}
        </span>
      }
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="ghost" size="sm" icon={<RotateCcw />} onClick={() => setAvailable({})}>
            Đặt lại số có sẵn
          </Button>
          <Button size="sm" onClick={onClose}>
            Hoàn tất
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-3 rounded-card border border-line bg-subtle/30 p-3.5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <span className="text-xs font-semibold text-muted">Giai đoạn tính toán:</span>
            <Checkbox
              checked={includeCrafting}
              onChange={setIncludeCrafting}
              label="Phân tích nguyên liệu thô"
              hint="Liệt kê nguyên liệu cơ bản nhất nếu tự chế"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {structure.stages.map((stage) => (
              <ToggleChip key={stage.id} checked={stageIds.includes(stage.id)} onChange={() => toggleStage(stage.id)}>
                {stage.name}
              </ToggleChip>
            ))}
          </div>
        </div>

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
                <Stat
                  label="Còn thiếu"
                  value={result.materials.filter((m) => !m.isSatisfied).length}
                  unit="loại"
                  tone={result.allSatisfied ? 'ok' : 'danger'}
                />
              </StatGrid>
            </Card>

            <Card padded={false}>
              <div className="px-4 pb-2 pt-3.5">
                <h4 className="text-sm font-semibold">Nhập số bạn đang có</h4>
                <p className="text-xs text-muted">Nhập số lượng trong rương đồ của bạn để kiểm tra còn thiếu bao nhiêu.</p>
              </div>

              <Table caption="Nguyên liệu cần và đang có">
                <Thead>
                  <Th>Vật phẩm</Th>
                  <Th align="right">Cần</Th>
                  <Th align="center">Đang có</Th>
                  <Th align="right">Thiếu</Th>
                  <Th>Cách có</Th>
                </Thead>
                <Tbody>
                  {result.materials.map((mat) => (
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
                          onValueChange={(v) => setAvailable((prev) => ({ ...prev, [mat.itemId]: Math.max(0, Math.floor(v)) }))}
                          className="mx-auto h-control-sm w-20 text-center text-xs"
                        />
                      </Td>
                      <Td align="right" numeric className="font-semibold">
                        {mat.isSatisfied ? <span className="text-ok">Đủ</span> : <span className="text-danger">{mat.missing}</span>}
                      </Td>
                      <Td className="text-xs text-muted">
                        {mat.isSatisfied ? (
                          '—'
                        ) : mat.craftingPlan && mat.craftingPlan.intermediateSteps.length > 0 ? (
                          <Link
                            to={`/planner?item=${mat.itemId}&qty=${mat.missing}`}
                            className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
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

            {includeCrafting && (
              <div className="space-y-2 rounded-card border border-line bg-subtle/30 p-3.5">
                <h4 className="flex items-center gap-2 text-xs font-semibold text-fg">
                  <Layers className="h-4 w-4 text-accent" />
                  Phân tích nguyên liệu thô cần gom
                </h4>
                <Table caption="Nguyên liệu thô cần gom" scroll={false}>
                  <Thead>
                    <Th>Nguyên liệu thô</Th>
                    <Th align="right">Tổng cần</Th>
                  </Thead>
                  <Tbody>
                    {rawTotals.length === 0 ? (
                      <Tr>
                        <Td align="center" colSpan={2} className="text-muted">
                          Không có vật phẩm nào cần chế tạo phức tạp.
                        </Td>
                      </Tr>
                    ) : (
                      rawTotals.map(([itemId, total]) => (
                        <Tr key={itemId}>
                          <Td>
                            <Link to={`/wiki/items?select=${itemId}`} className="font-medium text-accent hover:underline">
                              {db.itemsMap.get(itemId)?.name ?? itemId}
                            </Link>
                          </Td>
                          <Td align="right" numeric className="font-semibold">
                            {total}
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
