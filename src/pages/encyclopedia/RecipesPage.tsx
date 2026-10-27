import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hammer, Layers, Pencil, RotateCcw, Sparkles } from 'lucide-react';
import { useGameData } from '../../context/DataContext';
import { Recipe } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EntityImage } from '../../components/common/EntityImage';
import { Callout, Section, Stat, StatGrid } from '../../components/common/Layout';
import { EntityTile, WikiPage, useSaveEntity } from '../../components/wiki';
import { RecipeEditModal } from '../../components/recipes/RecipeEditModal';
import { storageService } from '../../services/storageService';

const HAND = 'hand';

// The data writes hand crafting as "Chế tạo tay" on some recipes and leaves it empty on others: one filter for both.
const HAND_LABELS = new Set(['hand', 'chế tạo tay']);

const workstationOf = (r: Recipe) => {
  const name = r.workstation?.trim();
  return !name || HAND_LABELS.has(name.toLowerCase()) ? HAND : name;
};

export const RecipesPage: React.FC = () => {
  const { db, reload } = useGameData();
  const navigate = useNavigate();
  const save = useSaveEntity('customRecipes');
  const [editing, setEditing] = useState<Partial<Recipe> | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Filter options come from the data so custom workbenches show up without code changes.
  const filterOptions = useMemo(() => {
    const stations = Array.from(new Set((db?.recipes ?? []).map(workstationOf))).sort((a, b) =>
      a === HAND ? -1 : b === HAND ? 1 : a.localeCompare(b)
    );
    // Bỏ 'all' (Tất cả) để hiển thị dropdown gọn gàng theo từng bàn chế tác
    return stations.map((s) => ({ id: s, label: s === HAND ? 'Chế tạo tay' : s }));
  }, [db?.recipes]);

  const sortedItems = useMemo(() => [...(db?.items ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [db?.items]);

  if (!db) return null;

  const nameOf = (itemId: string) => db.itemsMap.get(itemId)?.name ?? itemId;

  const handleSave = async (entity: Recipe) => {
    await save(entity);
    setEditing(null);
  };

  const handleRevert = async (recipeId: string) => {
    storageService.revertCustomEntity('customRecipes', recipeId);
    await reload();
    setEditing(null);
  };

  return (
    <WikiPage<Recipe>
      title="Công thức"
      description="Nguyên liệu, bàn chế tác và hiệu ứng của món ăn."
      icon={<Hammer />}
      noun="công thức"
      overrideKey="customRecipes"
      entities={db.recipes}
      searchPlaceholder="Tìm theo thành phẩm hoặc nguyên liệu..."
      getName={(r) => nameOf(r.outputItemId)}
      getSearchText={(r) =>
        [
          nameOf(r.outputItemId),
          db.itemsMap.get(r.outputItemId)?.vietnameseName,
          r.outputItemId,
          ...r.ingredients.flatMap((i) => [nameOf(i.itemId), db.itemsMap.get(i.itemId)?.vietnameseName]),
        ]
          .filter(Boolean)
          .join(' ')
      }
      filter={{
        type: 'select',
        label: 'Bàn chế tác',
        defaultId: HAND,
        options: filterOptions,
        matches: (r, id) => workstationOf(r) === id,
      }}
      onEdit={(recipe) => {
        setIsNew(!recipe);
        setEditing(
          recipe
            ? { ...recipe, ingredients: recipe.ingredients.map((i) => ({ ...i })) }
            : {
                id: `recipe_custom_${Date.now()}`,
                outputItemId: sortedItems[0]?.id,
                outputQuantity: 1,
                category: 'crafting',
                ingredients: [{ itemId: sortedItems[0]?.id ?? '', quantity: 1 }],
              }
        );
      }}
      layout="tiles"
      renderCard={(recipe, isSelected, onSelect) => {
        const output = db.itemsMap.get(recipe.outputItemId);
        return (
          <EntityTile
            key={recipe.id}
            folder="items"
            id={recipe.outputItemId}
            name={`${nameOf(recipe.outputItemId)}${recipe.outputQuantity > 1 ? ` ×${recipe.outputQuantity}` : ''}`}
            hint={recipe.isCustom ? 'Đã tùy chỉnh' : output?.vietnameseName}
            image={recipe.image ?? output?.image}
            isSelected={isSelected}
            onClick={onSelect}
          />
        );
      }}
      renderDetail={(recipe) => {
        const output = db.itemsMap.get(recipe.outputItemId);
        const buff = recipe.buffStats;
        return {
          title: nameOf(recipe.outputItemId),
          subtitle: output?.vietnameseName,
          badges: (
            <>
              <Badge tone={recipe.category === 'cooking' ? 'ok' : 'info'}>
                {workstationOf(recipe) === HAND ? 'Chế tạo tay' : recipe.workstation}
              </Badge>
              <Badge tone="accent">Ra ×{recipe.outputQuantity}</Badge>
              {recipe.levelRequired ? <Badge>Cấp {recipe.levelRequired}</Badge> : null}
              {recipe.isCustom && <Badge tone="warn">Đã tùy chỉnh</Badge>}
            </>
          ),
          body: (
            <>
              <EntityImage folder="items" id={recipe.outputItemId} image={recipe.image ?? output?.image} alt={nameOf(recipe.outputItemId)} />
              {(recipe.craftTimeSeconds || recipe.levelRequired) && (
                <StatGrid cols={3}>
                  {recipe.craftTimeSeconds ? <Stat label="Thời gian" value={recipe.craftTimeSeconds} unit="giây" /> : null}
                  {recipe.levelRequired ? <Stat label="Cấp yêu cầu" value={recipe.levelRequired} /> : null}
                  <Stat label="Số lượng ra" value={recipe.outputQuantity} />
                </StatGrid>
              )}

              {buff && (
                <Section title="Hiệu quả món ăn">
                  <Callout tone="accent" icon={<Sparkles />}>
                    <div className="space-y-0.5">
                      {buff.buffEffect && <div className="font-medium">{buff.buffEffect}</div>}
                      {buff.durationSeconds ? (
                        <div>
                          Kéo dài {Math.round(buff.durationSeconds / 60)} phút ({buff.durationSeconds}s)
                        </div>
                      ) : null}
                      {buff.hunger ? <div>No +{buff.hunger}</div> : null}
                      {buff.thirst ? <div>Khát +{buff.thirst}</div> : null}
                      {buff.healHp ? <div>Hồi {buff.healHp} HP</div> : null}
                    </div>
                  </Callout>
                </Section>
              )}

              <Section
                title={`Nguyên liệu (${recipe.ingredients.length})`}
                action={
                  <div className="flex items-center gap-1.5">
                    {recipe.isCustom && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<RotateCcw />}
                        className="text-amber-500 hover:text-amber-600"
                        onClick={() => handleRevert(recipe.id)}
                      >
                        Khôi phục gốc
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Pencil />}
                      onClick={() => {
                        setIsNew(false);
                        setEditing({
                          ...recipe,
                          ingredients: recipe.ingredients.map((i) => ({ ...i })),
                        });
                      }}
                    >
                      Sửa nguyên liệu
                    </Button>
                  </div>
                }
              >
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {recipe.ingredients.map((ing) => {
                    const item = db.itemsMap.get(ing.itemId);
                    return (
                      <li key={ing.itemId}>
                        <Link
                          to={`/wiki/items?select=${ing.itemId}`}
                          className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-subtle"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{item?.name ?? ing.itemId}</span>
                            {item?.vietnameseName && <span className="block truncate text-xs text-muted">{item.vietnameseName}</span>}
                          </span>
                          <span className="num shrink-0 font-semibold text-accent">×{ing.quantity}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Section>

              <Button block icon={<Layers />} onClick={() => navigate(`/planner?item=${recipe.outputItemId}`)}>
                Mở trong kế hoạch chế tạo
              </Button>
            </>
          ),
        };
      }}
    >
      <RecipeEditModal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        recipe={editing}
        isNew={isNew}
        onSave={handleSave}
        onRevert={handleRevert}
      />
    </WikiPage>
  );
};
