import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layers, Minus, Plus, Sparkles, Pencil } from 'lucide-react';
import { useGameData } from '../context/DataContext';
import { CraftingTreeNode, planCrafting } from '../lib/calculators/craftingPlanner';
import { Recipe } from '../types';
import { Button, IconButton } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { NumberInput } from '../components/common/Field';
import { ItemPicker } from '../components/common/ItemPicker';
import { Callout, EmptyState, PageHeader } from '../components/common/Layout';
import { Table, Tbody, Td, Th, Thead, Tr } from '../components/common/Table';
import { Tabs } from '../components/common/Tabs';
import { useToast } from '../components/common/Toast';
import { RecipeEditModal } from '../components/recipes/RecipeEditModal';
import { storageService } from '../services/storageService';

type PlannerTab = 'materials' | 'steps' | 'tree';

const TreeNode: React.FC<{ node: CraftingTreeNode; onEditRecipe?: (recipe: Recipe) => void }> = ({ node, onEditRecipe }) => (
  <li>
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1 text-sm">
      <span className="font-medium">{node.itemName}</span>
      <span className="num font-semibold text-accent">×{node.quantityRequired}</span>
      {node.craftsNeeded > 0 && (
        <span className="text-xs text-muted">
          chế {node.craftsNeeded} lần · {node.recipe?.workstation || 'chế tạo tay'}
        </span>
      )}
      {node.recipe?.isCustom && (
        <Badge tone="warn" size="sm">Tùy chỉnh</Badge>
      )}
      {node.recipe && onEditRecipe && (
        <button
          type="button"
          onClick={() => onEditRecipe(node.recipe!)}
          className="inline-flex items-center gap-1 text-xs text-accent hover:underline ml-1"
          title="Sửa số lượng nguyên liệu"
        >
          <Pencil className="h-3 w-3" /> Sửa tỉ lệ
        </button>
      )}
    </div>
    {node.children.length > 0 && (
      <ul className="ml-2 border-l border-line pl-4">
        {node.children.map((child, i) => (
          <TreeNode key={`${child.itemId}-${i}`} node={child} onEditRecipe={onEditRecipe} />
        ))}
      </ul>
    )}
  </li>
);

export const CraftingPlanner: React.FC = () => {
  const { db, reload } = useGameData();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const craftableItems = useMemo(
    () => (db?.items ?? []).filter((item) => db!.recipesByOutputMap.has(item.id)).sort((a, b) => a.name.localeCompare(b.name)),
    [db]
  );

  const [targetItemId, setTargetItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<PlannerTab>('materials');
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Weapon-mod bench hands over a ready list of materials: ?materials=itemId:qty,...&title=...
  const materialsParam = searchParams.get('materials');
  const planTitle = searchParams.get('title') || 'Danh sách nguyên liệu';

  const handedOverMaterials = useMemo(() => {
    if (!materialsParam || !db) return null;
    return materialsParam
      .split(',')
      .filter(Boolean)
      .map((part) => {
        const [itemId, qtyStr] = part.split(':');
        const item = db.itemsMap.get(itemId);
        return {
          itemId,
          itemName: item?.name || itemId,
          vietnameseName: item?.vietnameseName,
          required: Math.max(1, parseInt(qtyStr, 10) || 1),
        };
      });
  }, [materialsParam, db]);

  useEffect(() => {
    if (!db) return;
    const itemParam = searchParams.get('item');
    const qtyParam = Number(searchParams.get('qty'));
    setTargetItemId((current) =>
      itemParam && db.itemsMap.has(itemParam) ? itemParam : db.itemsMap.has(current) ? current : craftableItems[0]?.id ?? ''
    );
    if (Number.isFinite(qtyParam) && qtyParam >= 1) setQuantity(Math.floor(qtyParam));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, db]);

  const sync = (item: string, qty: number) => setSearchParams({ item, qty: String(qty) }, { replace: true });

  const changeItem = (id: string) => {
    setTargetItemId(id);
    sync(id, quantity);
  };

  const changeQuantity = (value: number) => {
    const next = Math.min(999, Math.max(1, Math.floor(value) || 1));
    setQuantity(next);
    sync(targetItemId, next);
  };

  const planFor = (qty: number) =>
    db && targetItemId
      ? planCrafting({ targetItemId, quantity: qty, recipesByOutput: db.recipesByOutputMap, itemsMap: db.itemsMap })
      : null;

  const plan = useMemo(() => planFor(quantity), [db, targetItemId, quantity]); // eslint-disable-line react-hooks/exhaustive-deps
  // One piece on its own, to show next to the total when crafting several.
  const singlePlan = useMemo(() => planFor(1), [db, targetItemId]); // eslint-disable-line react-hooks/exhaustive-deps
  const perPiece = useMemo(
    () => new Map((singlePlan?.totalRawMaterials ?? []).map((m) => [m.itemId, m.required])),
    [singlePlan]
  );

  const primaryRecipe = db?.recipesByOutputMap.get(targetItemId)?.[0];
  const buff = primaryRecipe?.buffStats;

  const tabs = plan
    ? [
        { id: 'materials', label: 'Nguyên liệu', count: plan.totalRawMaterials.length },
        { id: 'steps', label: 'Các bước chế', count: plan.intermediateSteps.length },
        { id: 'tree', label: 'Cây công thức' },
      ]
    : [];

  const handleSaveRecipe = async (updated: Recipe) => {
    storageService.saveEntity('customRecipes', updated);
    await reload();
    setEditingRecipe(null);
    toast.success('Đã lưu công thức.');
  };

  const handleRevertRecipe = async (recipeId: string) => {
    storageService.revertCustomEntity('customRecipes', recipeId);
    await reload();
    setEditingRecipe(null);
    toast.info('Đã khôi phục công thức gốc.');
  };

  return (
    <div>
      <PageHeader
        title="Kế hoạch chế tạo"
        description="Cần bao nhiêu nguyên liệu thô và chế qua những bước nào cho số lượng bạn chọn."
        icon={<Layers />}
      />

      {handedOverMaterials ? (
        <Card padded={false}>
          <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold">{planTitle}</h2>
              <p className="text-xs text-muted">{handedOverMaterials.length} loại nguyên liệu gom từ bản độ vũ khí.</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSearchParams({ item: targetItemId || craftableItems[0]?.id || '' }, { replace: true })}
            >
              Chế tạo theo công thức
            </Button>
          </div>
          <ul className="divide-y divide-line border-t border-line text-sm">
            {handedOverMaterials.map((m) => (
              <li key={m.itemId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0 truncate font-medium">
                  {m.itemName}
                  {m.vietnameseName && <span className="ml-1.5 text-xs font-normal text-faint">{m.vietnameseName}</span>}
                </span>
                <span className="num shrink-0 font-semibold text-accent">×{m.required}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <>
          <Card className="mb-4 space-y-3">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
              <div className="md:col-span-8">
                <ItemPicker label="Cần chế tạo" items={craftableItems} value={targetItemId} onChange={changeItem} />
              </div>
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
                </div>
              </div>
            </div>

            {primaryRecipe && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>
                    Bàn: <strong>{primaryRecipe.workstation || 'Chế tạo tay'}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Ra: <strong>×{primaryRecipe.outputQuantity}</strong>
                  </span>
                  {primaryRecipe.isCustom && <Badge tone="warn" size="sm">Đã tùy chỉnh</Badge>}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Pencil />}
                  onClick={() => setEditingRecipe(primaryRecipe)}
                >
                  Sửa nguyên liệu công thức
                </Button>
              </div>
            )}

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

          {!plan || !plan.tree ? (
            <EmptyState icon={<Layers />} title="Chọn vật phẩm để bắt đầu" />
          ) : (
            <div className="space-y-4">
              {plan.hasCircularDependency && (
                <Callout tone="warn">Công thức có vòng lặp: một số nguyên liệu được tính như nguyên liệu thô.</Callout>
              )}

              <Tabs tabs={tabs} activeTab={tab} onChange={(id) => setTab(id as PlannerTab)} />

              {tab === 'materials' && (
                <Card padded={false}>
                  <Table caption="Nguyên liệu thô cần chuẩn bị" scroll={false}>
                    <Thead>
                      <Th>Nguyên liệu</Th>
                      {quantity > 1 && <Th align="right">Mỗi cái</Th>}
                      <Th align="right">Tổng cho ×{quantity}</Th>
                    </Thead>
                    <Tbody>
                      {plan.totalRawMaterials.map((mat) => (
                        <Tr key={mat.itemId}>
                          <Td className="font-medium">{mat.itemName}</Td>
                          {quantity > 1 && (
                            <Td numeric align="right" className="text-muted">
                              {perPiece.get(mat.itemId) ?? '—'}
                            </Td>
                          )}
                          <Td numeric align="right" className="font-semibold text-accent">
                            {mat.required}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                  {quantity > 1 && plan.totalRawMaterials.some((m) => m.required !== (perPiece.get(m.itemId) ?? 0) * quantity) && (
                    <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
                      Tổng có thể thấp hơn "mỗi cái × số lượng" vì chế gộp một lần nên đỡ hao phần dư (ví dụ công thức ra 2 cái mỗi lượt).
                    </p>
                  )}
                </Card>
              )}

              {tab === 'steps' && (
                <ol className="space-y-2">
                  {plan.intermediateSteps.map((step, index) => {
                    const stepRecipe = db?.recipesByOutputMap.get(step.itemId)?.[0];
                    return (
                      <li key={step.itemId}>
                        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                              {index + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold">
                                  {step.itemName} <span className="num text-accent">×{step.totalOutputQuantity}</span>
                                </h3>
                                {stepRecipe?.isCustom && <Badge tone="warn" size="sm">Tùy chỉnh</Badge>}
                              </div>
                              <p className="text-xs text-muted">
                                {step.craftCount} lượt · {step.workstation || 'chế tạo tay'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <ul className="flex flex-wrap gap-1.5">
                              {step.ingredients.map((ing) => (
                                <li key={ing.itemId} className="num rounded-md bg-subtle px-2 py-1 text-xs">
                                  {ing.itemName} <span className="font-semibold text-accent">{ing.quantity * step.craftCount}</span>
                                </li>
                              ))}
                            </ul>
                            {stepRecipe && (
                              <IconButton
                                label={`Sửa công thức ${step.itemName}`}
                                className="border border-line"
                                onClick={() => setEditingRecipe(stepRecipe)}
                              >
                                <Pencil />
                              </IconButton>
                            )}
                          </div>
                        </Card>
                      </li>
                    );
                  })}
                </ol>
              )}

              {tab === 'tree' && (
                <Card className="overflow-x-auto">
                  <ul>
                    <TreeNode node={plan.tree} onEditRecipe={(r) => setEditingRecipe(r)} />
                  </ul>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      <RecipeEditModal
        isOpen={Boolean(editingRecipe)}
        onClose={() => setEditingRecipe(null)}
        recipe={editingRecipe}
        isNew={false}
        onSave={handleSaveRecipe}
        onRevert={handleRevertRecipe}
      />
    </div>
  );
};
