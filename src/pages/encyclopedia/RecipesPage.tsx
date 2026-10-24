import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hammer, Layers, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useGameData } from '../../context/DataContext';
import { Recipe, RecipeIngredient } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button, IconButton } from '../../components/common/Button';
import { EntityImage } from '../../components/common/EntityImage';
import { Field, NumberInput, Select, TextInput } from '../../components/common/Field';
import { FormModal, FormRow } from '../../components/common/FormModal';
import { Callout, Section, Stat, StatGrid } from '../../components/common/Layout';
import { CompactWikiCard, WikiPage, useSaveEntity } from '../../components/wiki';
import { RECIPE_CATEGORY_LABEL } from '../../lib/labels';

const HAND = 'hand';

const workstationOf = (r: Recipe) => r.workstation?.trim() || HAND;

export const RecipesPage: React.FC = () => {
  const { db } = useGameData();
  const navigate = useNavigate();
  const save = useSaveEntity('customRecipes');
  const [editing, setEditing] = useState<Partial<Recipe> | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Filter options come from the data so custom workbenches show up without code changes.
  const filterOptions = useMemo(() => {
    const stations = Array.from(new Set((db?.recipes ?? []).map(workstationOf))).sort((a, b) =>
      a === HAND ? -1 : b === HAND ? 1 : a.localeCompare(b)
    );
    return [
      { id: 'all', label: 'Tất cả' },
      ...stations.map((s) => ({ id: s, label: s === HAND ? 'Chế tạo tay' : s })),
    ];
  }, [db?.recipes]);

  const sortedItems = useMemo(() => [...(db?.items ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [db?.items]);

  if (!db) return null;

  const nameOf = (itemId: string) => db.itemsMap.get(itemId)?.name ?? itemId;
  const patch = (changes: Partial<Recipe>) => setEditing((prev) => (prev ? { ...prev, ...changes } : prev));

  const ingredients = editing?.ingredients ?? [];
  const setIngredient = (index: number, changes: Partial<RecipeIngredient>) =>
    patch({ ingredients: ingredients.map((ing, i) => (i === index ? { ...ing, ...changes } : ing)) });

  const canSave = Boolean(editing?.outputItemId) && ingredients.length > 0 && ingredients.every((i) => i.itemId && i.quantity > 0);

  const handleSave = async () => {
    if (!editing || !canSave) return;
    const entity = {
      ...editing,
      id: editing.id!,
      outputItemId: editing.outputItemId!,
      outputQuantity: editing.outputQuantity || 1,
      ingredients,
      workstation: editing.workstation?.trim() || undefined,
      isCustom: true,
    } as Recipe;
    await save(entity);
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
      filter={{ options: filterOptions, matches: (r, id) => workstationOf(r) === id }}
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
      renderCard={(recipe, isSelected, onSelect) => {
        const output = db.itemsMap.get(recipe.outputItemId);
        return (
          <CompactWikiCard
            key={recipe.id}
            id={recipe.id}
            title={`${nameOf(recipe.outputItemId)}${recipe.outputQuantity > 1 ? ` ×${recipe.outputQuantity}` : ''}`}
            subtitle={output?.vietnameseName}
            isSelected={isSelected}
            onClick={onSelect}
            stats={[
              { label: 'Nguyên liệu', value: recipe.ingredients.length },
              ...(recipe.craftTimeSeconds ? [{ label: 'Thời gian', value: `${recipe.craftTimeSeconds}s` }] : []),
            ]}
            badges={
              <>
                <Badge tone={recipe.category === 'cooking' ? 'ok' : 'info'}>{workstationOf(recipe) === HAND ? 'Chế tạo tay' : recipe.workstation}</Badge>
                {recipe.category && <Badge>{RECIPE_CATEGORY_LABEL[recipe.category]}</Badge>}
                {recipe.isCustom && <Badge tone="accent">Tùy chỉnh</Badge>}
              </>
            }
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
              {recipe.isCustom && <Badge tone="info">Tùy chỉnh</Badge>}
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

              <Section title={`Nguyên liệu (${recipe.ingredients.length})`}>
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
      <FormModal
        isOpen={Boolean(editing)}
        title={isNew ? 'Thêm công thức' : 'Sửa công thức'}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        saveDisabled={!canSave}
        maxWidth="md"
      >
        {editing && (
          <>
            <Field label="Thành phẩm">
              <Select value={editing.outputItemId ?? ''} onChange={(e) => patch({ outputItemId: e.target.value })}>
                {sortedItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </Select>
            </Field>
            <FormRow cols={3}>
              <Field label="Số lượng ra">
                <NumberInput min={1} value={editing.outputQuantity} onValueChange={(v) => patch({ outputQuantity: Math.max(1, v) })} />
              </Field>
              <Field label="Thời gian (giây)">
                <NumberInput value={editing.craftTimeSeconds} onValueChange={(v) => patch({ craftTimeSeconds: v || undefined })} />
              </Field>
              <Field label="Loại">
                <Select value={editing.category ?? 'crafting'} onChange={(e) => patch({ category: e.target.value as Recipe['category'] })}>
                  {Object.entries(RECIPE_CATEGORY_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
            </FormRow>
            <Field label="Bàn chế tác" hint="Để trống nếu chế tạo tay">
              <TextInput
                list="workstation-options"
                value={editing.workstation ?? ''}
                onChange={(e) => patch({ workstation: e.target.value })}
              />
              <datalist id="workstation-options">
                {filterOptions
                  .filter((o) => o.id !== 'all' && o.id !== HAND)
                  .map((o) => (
                    <option key={o.id} value={o.id} />
                  ))}
              </datalist>
            </Field>

            <Section
              title="Nguyên liệu"
              action={
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Plus />}
                  onClick={() => patch({ ingredients: [...ingredients, { itemId: sortedItems[0]?.id ?? '', quantity: 1 }] })}
                >
                  Thêm
                </Button>
              }
            >
              <ul className="space-y-2">
                {ingredients.map((ing, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Select
                      aria-label="Nguyên liệu"
                      value={ing.itemId}
                      onChange={(e) => setIngredient(index, { itemId: e.target.value })}
                      className="flex-1"
                    >
                      {sortedItems.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </Select>
                    <NumberInput
                      aria-label="Số lượng"
                      min={1}
                      value={ing.quantity}
                      onValueChange={(v) => setIngredient(index, { quantity: Math.max(1, v) })}
                      className="w-20"
                    />
                    <IconButton
                      label="Xóa nguyên liệu"
                      disabled={ingredients.length <= 1}
                      onClick={() => patch({ ingredients: ingredients.filter((_, i) => i !== index) })}
                    >
                      <Trash2 />
                    </IconButton>
                  </li>
                ))}
              </ul>
            </Section>
          </>
        )}
      </FormModal>
    </WikiPage>
  );
};
