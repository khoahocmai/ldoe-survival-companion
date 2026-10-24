import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calculator, Layers, Sword, Wrench } from 'lucide-react';
import { useGameData } from '../../context/DataContext';
import { Item, ItemCategory } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EntityImage } from '../../components/common/EntityImage';
import { Field, Select, TextInput, Textarea, NumberInput } from '../../components/common/Field';
import { FormModal, FormRow } from '../../components/common/FormModal';
import { PropertyList, Section, Stat, StatGrid } from '../../components/common/Layout';
import { CompactWikiCard, WikiPage, useSaveEntity } from '../../components/wiki';
import { ITEM_CATEGORY_LABEL, RARITY_LABEL, RARITY_TONE } from '../../lib/labels';

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'weapons', label: 'Vũ khí' },
  { id: 'armor', label: 'Giáp' },
  { id: 'resources', label: 'Tài nguyên' },
  { id: 'medical', label: 'Y tế & thức ăn' },
  { id: 'components', label: 'Linh kiện' },
];

const matchesFilter = (item: Item, filterId: string) => {
  switch (filterId) {
    case 'weapons':
      return item.category.startsWith('weapon_');
    case 'armor':
      return item.category.startsWith('armor_');
    case 'resources':
      return item.category.startsWith('resource_');
    case 'medical':
      return item.category === 'medical' || item.category === 'food';
    case 'components':
      return item.category === 'component' || item.category === 'special' || item.category === 'tool';
    default:
      return true;
  }
};

const newItem = (): Partial<Item> => ({
  id: `item_custom_${Date.now()}`,
  name: '',
  vietnameseName: '',
  category: 'resource_raw',
  rarity: 'common',
  stackSize: 20,
  description: '',
  notes: '',
});

export const ItemsPage: React.FC = () => {
  const { db } = useGameData();
  const navigate = useNavigate();
  const save = useSaveEntity('customItems');
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [isNew, setIsNew] = useState(false);

  if (!db) return null;

  const patch = (changes: Partial<Item>) => setEditing((prev) => (prev ? { ...prev, ...changes } : prev));

  const handleSave = async () => {
    if (!editing?.name?.trim() || !editing.id?.trim()) return;
    // Spread the whole entity first: fields the form does not edit (craftable, obtainLocations,
    // icon, stats...) must survive an edit instead of being silently dropped.
    const entity = {
      ...editing,
      id: editing.id.trim(),
      name: editing.name.trim(),
      category: editing.category as ItemCategory,
      rarity: editing.rarity ?? 'common',
      stackSize: editing.stackSize || 1,
      description: editing.description ?? '',
      isCustom: true,
    } as Item;
    await save(entity);
    setEditing(null);
  };

  return (
    <>
      <WikiPage<Item>
        title="Vật phẩm"
        description="Vũ khí, giáp, nguyên liệu và đồ dùng: tra thông số và công thức."
        icon={<Sword />}
        noun="vật phẩm"
        overrideKey="customItems"
        entities={db.items}
        searchPlaceholder="Tìm vật phẩm..."
        getName={(i) => i.name}
        getSearchText={(i) => `${i.name} ${i.vietnameseName ?? ''} ${i.id} ${ITEM_CATEGORY_LABEL[i.category] ?? ''}`}
        filter={{ options: FILTERS, matches: matchesFilter }}
        onEdit={(item) => {
          setIsNew(!item);
          setEditing(item ? { ...item } : newItem());
        }}
        renderCard={(item, isSelected, onSelect) => (
          <CompactWikiCard
            key={item.id}
            id={item.id}
            title={item.name}
            subtitle={item.vietnameseName}
            isSelected={isSelected}
            onClick={onSelect}
            stats={
              item.weaponStats
                ? [
                    { label: 'Dmg', value: item.weaponStats.damage },
                    { label: 'Bền', value: item.weaponStats.durability },
                  ]
                : item.armorStats
                  ? [
                      { label: 'Giáp', value: item.armorStats.armorValue },
                      { label: 'Bền', value: item.armorStats.durability },
                    ]
                  : item.consumableStats?.healHp
                    ? [{ label: 'Hồi', value: `+${item.consumableStats.healHp} HP` }]
                    : [{ label: 'Stack', value: item.stackSize }]
            }
            badges={
              <>
                <Badge tone={RARITY_TONE[item.rarity]}>{RARITY_LABEL[item.rarity]}</Badge>
                <Badge>{ITEM_CATEGORY_LABEL[item.category] ?? item.category}</Badge>
                {item.isCustom && <Badge tone="info">Tùy chỉnh</Badge>}
              </>
            }
          />
        )}
        renderDetail={(item) => {
          const recipe = db.recipesByOutputMap.get(item.id)?.[0];
          const locations = (item.obtainLocations ?? [])
            .map((id) => db.locationsMap.get(id))
            .filter((l): l is NonNullable<typeof l> => Boolean(l));

          return {
            title: item.name,
            subtitle: item.vietnameseName,
            badges: (
              <>
                <Badge tone={RARITY_TONE[item.rarity]}>{RARITY_LABEL[item.rarity]}</Badge>
                <Badge>{ITEM_CATEGORY_LABEL[item.category] ?? item.category}</Badge>
                <Badge>Stack {item.stackSize}</Badge>
                {item.isCustom && <Badge tone="info">Tùy chỉnh</Badge>}
              </>
            ),
            body: (
              <>
                <EntityImage folder="items" id={item.id} image={item.image} alt={item.name} />
                {item.description && <p className="text-sm leading-relaxed text-muted">{item.description}</p>}

                {item.weaponStats && (
                  <Section title="Thông số vũ khí">
                    <StatGrid cols={4}>
                      <Stat label="Sát thương" value={item.weaponStats.damage} tone="accent" />
                      <Stat label="Tốc đánh" value={item.weaponStats.attackSpeed} unit="/s" />
                      <Stat label="Độ bền" value={item.weaponStats.durability} unit="đòn" />
                      <Stat label="Đánh lén" value={`×${item.weaponStats.sneakMultiplier ?? (item.weaponStats.isFirearm ? 1 : 3)}`} />
                    </StatGrid>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="soft"
                        className="flex-1"
                        icon={<Calculator />}
                        onClick={() => navigate(`/combat?weapon=${item.id}`)}
                      >
                        Tính hạ quái bằng vũ khí này
                      </Button>
                      {(db.weaponModsByWeaponIdMap?.get(item.id)?.length ?? 0) > 0 && (
                        <Button
                          variant="secondary"
                          className="flex-1"
                          icon={<Wrench />}
                          onClick={() => navigate(`/wiki/weapon-mods?weapon=${item.id}`)}
                        >
                          Độ vũ khí này ({db.weaponModsByWeaponIdMap.get(item.id)?.length} bản mod)
                        </Button>
                      )}
                    </div>
                  </Section>
                )}

                {item.armorStats && (
                  <Section title="Chỉ số giáp">
                    <StatGrid cols={3}>
                      <Stat label="Vị trí" value={ITEM_CATEGORY_LABEL[item.category]} />
                      <Stat label="Điểm giáp" value={`+${item.armorStats.armorValue}`} tone="info" />
                      <Stat label="Độ bền" value={item.armorStats.durability} />
                    </StatGrid>
                  </Section>
                )}

                {item.consumableStats && (
                  <Section title="Hiệu quả sử dụng">
                    <StatGrid cols={3}>
                      {item.consumableStats.healHp ? <Stat label="Hồi máu" value={`+${item.consumableStats.healHp}`} tone="ok" /> : null}
                      {item.consumableStats.hunger ? <Stat label="Độ no" value={`+${item.consumableStats.hunger}`} tone="accent" /> : null}
                      {item.consumableStats.thirst ? <Stat label="Độ khát" value={`+${item.consumableStats.thirst}`} tone="info" /> : null}
                    </StatGrid>
                    {item.consumableStats.buffEffect && (
                      <p className="mt-2 text-sm text-muted">
                        {item.consumableStats.buffEffect}
                        {item.consumableStats.durationSeconds ? ` (${item.consumableStats.durationSeconds}s)` : ''}
                      </p>
                    )}
                  </Section>
                )}

                {recipe && (
                  <Section title="Công thức chế tạo">
                    <PropertyList
                      items={[
                        { label: 'Bàn chế tạo', value: recipe.workstation || 'Chế tạo tay' },
                        { label: 'Số lượng ra', value: recipe.outputQuantity },
                      ]}
                    />
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {recipe.ingredients.map((ing) => (
                        <li key={ing.itemId}>
                          <Link
                            to={`/wiki/items?select=${ing.itemId}`}
                            className="num inline-flex rounded-md bg-subtle px-2 py-1 text-xs hover:text-accent"
                          >
                            {ing.quantity}× {db.itemsMap.get(ing.itemId)?.name ?? ing.itemId}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant="secondary"
                      block
                      className="mt-3"
                      icon={<Layers />}
                      onClick={() => navigate(`/planner?item=${item.id}`)}
                    >
                      Lên kế hoạch chế tạo
                    </Button>
                  </Section>
                )}

                {locations.length > 0 && (
                  <Section title="Nơi nhận được">
                    <ul className="flex flex-wrap gap-1.5">
                      {locations.map((loc) => (
                        <li key={loc.id}>
                          <Link
                            to={`/wiki/locations?select=${loc.id}`}
                            className="inline-flex rounded-md bg-subtle px-2 py-1 text-xs hover:text-accent"
                          >
                            {loc.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {item.notes && (
                  <Section title="Ghi chú">
                    <p className="whitespace-pre-line rounded-lg bg-subtle p-3 text-sm leading-relaxed text-muted">{item.notes}</p>
                  </Section>
                )}
              </>
            ),
          };
        }}
      >
        <FormModal
          isOpen={Boolean(editing)}
          title={isNew ? 'Thêm vật phẩm' : 'Sửa vật phẩm'}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          saveDisabled={!editing?.name?.trim() || !editing?.id?.trim()}
          maxWidth="md"
        >
          {editing && (
            <>
              <FormRow>
                <Field label="Tên (tiếng Anh)">
                  <TextInput autoFocus value={editing.name ?? ''} onChange={(e) => patch({ name: e.target.value })} />
                </Field>
                <Field label="Tên tiếng Việt" hint="Không bắt buộc">
                  <TextInput value={editing.vietnameseName ?? ''} onChange={(e) => patch({ vietnameseName: e.target.value })} />
                </Field>
              </FormRow>
              <FormRow>
                <Field label="Nhóm">
                  <Select value={editing.category} onChange={(e) => patch({ category: e.target.value as ItemCategory })}>
                    {Object.entries(ITEM_CATEGORY_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Độ hiếm">
                  <Select value={editing.rarity} onChange={(e) => patch({ rarity: e.target.value as Item['rarity'] })}>
                    {Object.entries(RARITY_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </FormRow>
              <FormRow>
                <Field label="Số lượng tối đa mỗi ô">
                  <NumberInput min={1} value={editing.stackSize} onValueChange={(v) => patch({ stackSize: v })} />
                </Field>
                <Field label="ID" hint={isNew ? 'Duy nhất, viết thường không dấu' : 'Không thể đổi khi sửa'}>
                  <TextInput
                    value={editing.id ?? ''}
                    disabled={!isNew}
                    onChange={(e) => patch({ id: e.target.value })}
                    className="font-mono"
                  />
                </Field>
              </FormRow>
              <Field label="Mô tả">
                <Textarea rows={2} value={editing.description ?? ''} onChange={(e) => patch({ description: e.target.value })} />
              </Field>
              <Field label="Ghi chú / mẹo">
                <Textarea rows={2} value={editing.notes ?? ''} onChange={(e) => patch({ notes: e.target.value })} />
              </Field>
            </>
          )}
        </FormModal>
      </WikiPage>
    </>
  );
};
