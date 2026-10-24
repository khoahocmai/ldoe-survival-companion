import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Layers, Minus, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { useGameData } from '../context/DataContext';
import { CraftingTreeNode, planCrafting } from '../lib/calculators/craftingPlanner';
import { Badge } from '../components/common/Badge';
import { Button, IconButton } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Field, NumberInput, Select } from '../components/common/Field';
import { Callout, EmptyState, PageHeader, Stat, StatGrid } from '../components/common/Layout';
import { Tabs } from '../components/common/Tabs';

type PlannerTab = 'materials' | 'steps' | 'checklist' | 'tree';

const TreeNode: React.FC<{ node: CraftingTreeNode }> = ({ node }) => (
  <li>
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1 text-sm">
      <span className="font-medium">{node.itemName}</span>
      <span className="num font-semibold text-accent">×{node.quantityRequired}</span>
      {node.usedFromInventory > 0 && <Badge tone="ok">Có sẵn {node.usedFromInventory}</Badge>}
      {node.craftsNeeded > 0 && (
        <span className="text-xs text-muted">
          chế {node.craftsNeeded} lần · {node.recipe?.workstation || 'chế tạo tay'}
        </span>
      )}
    </div>
    {node.children.length > 0 && (
      <ul className="ml-2 border-l border-line pl-4">
        {node.children.map((child, i) => (
          <TreeNode key={`${child.itemId}-${i}`} node={child} />
        ))}
      </ul>
    )}
  </li>
);

export const CraftingPlanner: React.FC = () => {
  const { db } = useGameData();
  const [searchParams, setSearchParams] = useSearchParams();

  const craftableItems = useMemo(
    () => (db?.items ?? []).filter((item) => db!.recipesByOutputMap.has(item.id)).sort((a, b) => a.name.localeCompare(b.name)),
    [db]
  );

  const [targetItemId, setTargetItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<PlannerTab>('materials');
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const materialsParam = searchParams.get('materials');
  const planTitleParam = searchParams.get('title') || 'Danh sách nguyên liệu gom đồ';

  const customMaterialsList = useMemo(() => {
    if (!materialsParam || !db) return null;
    try {
      return materialsParam.split(',').map((part) => {
        const [itemId, qtyStr] = part.split(':');
        const qty = Math.max(1, parseInt(qtyStr, 10) || 1);
        const item = db.itemsMap.get(itemId);
        return {
          itemId,
          itemName: item?.name || itemId,
          vietnameseName: item?.vietnameseName,
          required: qty,
        };
      });
    } catch {
      return null;
    }
  }, [materialsParam, db]);

  useEffect(() => {
    if (!db) return;
    const itemParam = searchParams.get('item');
    const qtyParam = Number(searchParams.get('qty'));
    setTargetItemId((current) =>
      itemParam && db.itemsMap.has(itemParam)
        ? itemParam
        : db.itemsMap.has(current)
          ? current
          : craftableItems[0]?.id ?? ''
    );
    if (Number.isFinite(qtyParam) && qtyParam >= 1) setQuantity(Math.floor(qtyParam));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, db]);

  const sync = (item: string, qty: number) =>
    setSearchParams({ item, qty: String(qty) }, { replace: true });

  const changeItem = (id: string) => {
    setTargetItemId(id);
    setInventory({});
    setChecked({});
    sync(id, quantity);
  };

  const changeQuantity = (value: number) => {
    const next = Math.min(999, Math.max(1, Math.floor(value) || 1));
    setQuantity(next);
    sync(targetItemId, next);
  };

  const plan = useMemo(() => {
    if (!db || !targetItemId) return null;
    return planCrafting({
      targetItemId,
      quantity,
      inventory,
      recipesByOutput: db.recipesByOutputMap,
      itemsMap: db.itemsMap,
    });
  }, [db, targetItemId, quantity, inventory]);

  const customRawMaterials = useMemo(() => {
    if (!customMaterialsList) return null;
    return customMaterialsList.map((m) => {
      const current = inventory[m.itemId] || 0;
      const missing = Math.max(0, m.required - current);
      return {
        itemId: m.itemId,
        itemName: m.vietnameseName ? `${m.itemName} (${m.vietnameseName})` : m.itemName,
        required: m.required,
        usedFromInventory: Math.min(current, m.required),
        missing,
        isSatisfied: current >= m.required,
      };
    });
  }, [customMaterialsList, inventory]);

  const activeRawMaterials = customRawMaterials ?? plan?.totalRawMaterials ?? [];
  const missingCount = activeRawMaterials.filter((m) => !m.isSatisfied).length;
  const hasInventory = Object.values(inventory).some((v) => v > 0);
  const buff = db?.recipesByOutputMap.get(targetItemId)?.[0]?.buffStats;

  const tabs = customMaterialsList
    ? [
        { id: 'materials', label: 'Nguyên liệu', count: activeRawMaterials.length },
        { id: 'checklist', label: 'Checklist' },
      ]
    : plan
      ? [
          { id: 'materials', label: 'Nguyên liệu', count: plan.totalRawMaterials.length },
          { id: 'steps', label: 'Các bước chế', count: plan.intermediateSteps.length },
          { id: 'checklist', label: 'Checklist' },
          { id: 'tree', label: 'Cây công thức' },
        ]
      : [];

  return (
    <div>
      <PageHeader
        title="Kế hoạch chế tạo"
        description="Phân rã công thức nhiều tầng thành nguyên liệu thô, trừ đi đồ bạn đang có."
        icon={<Layers />}
      />

      {customMaterialsList && (
        <Card className="mb-6 space-y-3 border-accent bg-accent-soft/30">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Gom đồ bản độ vũ khí</span>
              <h2 className="text-base font-bold text-fg">{planTitleParam}</h2>
              <p className="text-xs text-muted">Danh sách {customMaterialsList.length} loại nguyên liệu đã gom từ Gunsmith Bench.</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSearchParams({ item: targetItemId || craftableItems[0]?.id || '' }, { replace: true })}
            >
              Chế tạo theo cây công thức
            </Button>
          </div>
        </Card>
      )}

      {!customMaterialsList && (
        <Card className="mb-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <Field label="Cần chế tạo" className="md:col-span-8">
              <Select value={targetItemId} onChange={(e) => changeItem(e.target.value)}>
                {craftableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.vietnameseName ? ` — ${item.vietnameseName}` : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="md:col-span-4">
              <span className="mb-1.5 block text-xs font-medium text-muted">Số lượng</span>
              <div className="flex items-center gap-1.5">
                <IconButton label="Giảm" className="border border-line" onClick={() => changeQuantity(quantity - 1)}>
                  <Minus />
                </IconButton>
                <NumberInput
                  aria-label="Số lượng"
                  min={1}
                  max={999}
                  value={quantity}
                  onValueChange={changeQuantity}
                  className="w-20 text-center font-semibold"
                />
                <IconButton label="Tăng" className="border border-line" onClick={() => changeQuantity(quantity + 1)}>
                  <Plus />
                </IconButton>
                <div className="ml-auto flex gap-1">
                  {[5, 10, 20].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => changeQuantity(n)}
                      className="num h-9 rounded-lg bg-subtle px-2.5 text-xs text-muted hover:text-fg"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {buff && (
            <Callout tone="accent" icon={<Sparkles />}>
              <strong>{buff.buffEffect || 'Tăng chỉ số'}</strong>
              {buff.durationSeconds ? ` · ${Math.round(buff.durationSeconds / 60)} phút` : ''}
              {buff.hunger ? ` · No +${buff.hunger}` : ''}
              {buff.thirst ? ` · Khát +${buff.thirst}` : ''}
              {buff.healHp ? ` · Hồi ${buff.healHp} HP` : ''}
            </Callout>
          )}
        </Card>
      )}

      {!customMaterialsList && (!plan || !plan.tree) ? (
        <EmptyState icon={<Layers />} title="Chọn vật phẩm để bắt đầu" />
      ) : (
        <div className="space-y-4">
          <StatGrid cols={3}>
            <Stat label="Nguyên liệu thô" value={activeRawMaterials.length} unit="loại" />
            <Stat label="Còn thiếu" value={missingCount} unit="loại" tone={missingCount ? 'danger' : 'ok'} />
            <Stat
              label="Lượt chế"
              value={customMaterialsList ? 0 : plan?.intermediateSteps.reduce((sum, s) => sum + s.craftCount, 0) ?? 0}
            />
          </StatGrid>

          {!customMaterialsList && plan?.hasCircularDependency && (
            <Callout tone="warn">Công thức có vòng lặp: một số nguyên liệu được tính như nguyên liệu thô.</Callout>
          )}

          <Tabs tabs={tabs} activeTab={tab} onChange={(id) => setTab(id as PlannerTab)} />

          {tab === 'materials' && (
            <Card padded={false}>
              <div className="flex items-center justify-between gap-3 px-4 pt-4">
                <p className="text-xs text-muted">Nhập số bạn đang có. Chỉ dùng cho lần tính này, không lưu lại.</p>
                {hasInventory && (
                  <Button variant="ghost" size="sm" icon={<RotateCcw />} onClick={() => setInventory({})}>
                    Xóa
                  </Button>
                )}
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-y border-line text-xs text-muted">
                      <th className="px-4 py-2 font-medium">Nguyên liệu</th>
                      <th className="px-2 py-2 text-right font-medium">Cần</th>
                      <th className="px-2 py-2 text-center font-medium">Đang có</th>
                      <th className="px-4 py-2 text-right font-medium">Thiếu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {activeRawMaterials.map((mat) => (
                      <tr key={mat.itemId}>
                        <td className="px-4 py-2.5 font-medium">{mat.itemName}</td>
                        <td className="num px-2 py-2.5 text-right font-semibold">{mat.required}</td>
                        <td className="px-2 py-2.5">
                          <NumberInput
                            aria-label={`Số ${mat.itemName} đang có`}
                            value={inventory[mat.itemId] || undefined}
                            placeholder="0"
                            onValueChange={(v) => setInventory((prev) => ({ ...prev, [mat.itemId]: Math.max(0, Math.floor(v)) }))}
                            className="mx-auto h-8 w-20 text-center"
                          />
                        </td>
                        <td className="num px-4 py-2.5 text-right font-semibold">
                          {mat.isSatisfied ? (
                            <span className="inline-flex items-center gap-1 text-ok">
                              <CheckCircle2 className="h-4 w-4" /> Đủ
                            </span>
                          ) : (
                            <span className="text-danger">{mat.missing}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {tab === 'steps' && (
            <ol className="space-y-2">
              {plan.intermediateSteps.length === 0 && (
                <EmptyState title="Không cần chế bước trung gian" description="Mọi thứ đã có sẵn hoặc là nguyên liệu thô." />
              )}
              {plan.intermediateSteps.map((step, index) => (
                <li key={step.itemId}>
                  <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold">
                          {step.itemName} <span className="num text-accent">×{step.totalOutputQuantity}</span>
                        </h3>
                        <p className="text-xs text-muted">
                          {step.craftCount} lượt · {step.workstation || 'chế tạo tay'}
                        </p>
                      </div>
                    </div>
                    <ul className="flex flex-wrap gap-1.5 sm:justify-end">
                      {step.ingredients.map((ing) => (
                        <li key={ing.itemId} className="num rounded-md bg-subtle px-2 py-1 text-xs">
                          {ing.itemName} <span className="font-semibold text-accent">{ing.quantity * step.craftCount}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </li>
              ))}
            </ol>
          )}

          {tab === 'checklist' && (
            <Card padded={false}>
              <p className="px-4 pt-4 text-xs text-muted">Đánh dấu nguyên liệu bạn đã gom đủ khi đi farm.</p>
              <ul className="mt-3 divide-y divide-line border-t border-line">
                {activeRawMaterials.map((mat) => {
                  const done = checked[mat.itemId] || mat.isSatisfied;
                  return (
                    <li key={mat.itemId}>
                      <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-subtle">
                        <input
                          type="checkbox"
                          checked={done}
                          disabled={mat.isSatisfied}
                          onChange={() => setChecked((prev) => ({ ...prev, [mat.itemId]: !prev[mat.itemId] }))}
                          className="h-4 w-4 accent-[rgb(var(--accent-solid))]"
                        />
                        <span className={`flex-1 text-sm font-medium ${done ? 'text-faint line-through' : ''}`}>{mat.itemName}</span>
                        <span className="num text-xs text-muted">
                          cần {mat.required}
                          {mat.missing > 0 && <span className="text-danger"> · thiếu {mat.missing}</span>}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {tab === 'tree' && (
            <Card className="overflow-x-auto">
              <ul>
                <TreeNode node={plan.tree} />
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
