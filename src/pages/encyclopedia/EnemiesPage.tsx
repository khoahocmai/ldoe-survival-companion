import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calculator, Skull, Target } from 'lucide-react';
import { useGameData } from '../../context/DataContext';
import { Enemy } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EntityImage } from '../../components/common/EntityImage';
import { ImageField } from '../../components/common/ImageField';
import { Field, NumberInput, Select, TextInput, Textarea } from '../../components/common/Field';
import { FormModal, FormRow } from '../../components/common/FormModal';
import { Callout, Section, Stat, StatGrid } from '../../components/common/Layout';
import { EntityTile, WikiPage, useSaveEntity } from '../../components/wiki';
import { dangerTone, ENEMY_CATEGORY_LABEL, MOVEMENT_LABEL } from '../../lib/labels';

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'zombie', label: 'Zombie' },
  { id: 'boss', label: 'Boss' },
  { id: 'wildlife', label: 'Động vật' },
  { id: 'machine', label: 'Cơ giới' },
];

const newEnemy = (): Partial<Enemy> => ({
  id: `enemy_custom_${Date.now()}`,
  name: '',
  vietnameseName: '',
  category: 'zombie',
  hp: 100,
  damage: 15,
  armor: 0,
  dangerRating: 2,
  movementSpeed: 'normal',
  description: '',
  drops: [],
  locations: [],
  abilities: [],
  combatTips: [],
});

const Skulls: React.FC<{ level: number }> = ({ level }) => (
  <span aria-label={`Độ nguy hiểm ${level}/5`} title={`Độ nguy hiểm ${level}/5`}>
    {'💀'.repeat(Math.max(1, Math.min(5, level)))}
  </span>
);

export const EnemiesPage: React.FC = () => {
  const { db } = useGameData();
  const navigate = useNavigate();
  const save = useSaveEntity('customEnemies');
  const [editing, setEditing] = useState<Partial<Enemy> | null>(null);
  const [isNew, setIsNew] = useState(false);

  if (!db) return null;

  const patch = (changes: Partial<Enemy>) => setEditing((prev) => (prev ? { ...prev, ...changes } : prev));

  const handleSave = async () => {
    if (!editing?.name?.trim() || !editing.id?.trim()) return;
    const entity = {
      ...editing,
      id: editing.id.trim(),
      name: editing.name.trim(),
      category: editing.category ?? 'zombie',
      hp: editing.hp ?? 100,
      damage: editing.damage ?? 0,
      armor: editing.armor ?? 0,
      dangerRating: editing.dangerRating ?? 1,
      description: editing.description ?? '',
      drops: editing.drops ?? [],
      locations: editing.locations ?? [],
      isCustom: true,
    } as Enemy;
    await save(entity);
    setEditing(null);
  };

  return (
    <WikiPage<Enemy>
      title="Xác sống & Boss"
      description="Máu, sát thương, kỹ năng nguy hiểm và mẹo khắc chế từng loại quái."
      icon={<Skull />}
      noun="quái vật"
      overrideKey="customEnemies"
      entities={db.enemies}
      searchPlaceholder="Tìm quái vật..."
      getName={(e) => e.name}
      getSearchText={(e) => `${e.name} ${e.vietnameseName ?? ''} ${e.id}`}
      filter={{ options: FILTERS, matches: (e, id) => e.category === id }}
      onEdit={(enemy) => {
        setIsNew(!enemy);
        setEditing(enemy ? { ...enemy } : newEnemy());
      }}
      layout="tiles"
      renderCard={(enemy, isSelected, onSelect) => (
        <EntityTile
          key={enemy.id}
          folder="enemies"
          id={enemy.id}
          name={enemy.name}
          hint={enemy.vietnameseName}
          image={enemy.image}
          tone={enemy.category === 'boss' ? 'danger' : dangerTone(enemy.dangerRating)}
          isSelected={isSelected}
          onClick={onSelect}
        />
      )}
      renderDetail={(enemy) => ({
        title: enemy.name,
        subtitle: enemy.vietnameseName,
        badges: (
          <>
            <Badge tone={enemy.category === 'boss' ? 'danger' : 'neutral'}>{ENEMY_CATEGORY_LABEL[enemy.category]}</Badge>
            <Badge tone={dangerTone(enemy.dangerRating)}>
              <Skulls level={enemy.dangerRating} />
            </Badge>
            {enemy.isCustom && <Badge tone="info">Tùy chỉnh</Badge>}
          </>
        ),
        body: (
          <>
            <EntityImage folder="enemies" id={enemy.id} image={enemy.image} alt={enemy.name} />
            {enemy.description && <p className="text-sm leading-relaxed text-muted">{enemy.description}</p>}

            <StatGrid cols={4}>
              <Stat label="Máu" value={enemy.hp} unit="HP" tone="danger" />
              <Stat label="Sát thương" value={enemy.damage} tone="accent" />
              <Stat label="Giáp" value={enemy.armor} />
              <Stat label="Tốc độ" value={enemy.movementSpeed ? MOVEMENT_LABEL[enemy.movementSpeed] : '—'} />
            </StatGrid>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="soft" icon={<Calculator />} onClick={() => navigate(`/combat?enemy=${enemy.id}`)}>
                Tính hạ quái
              </Button>
              <Button variant="secondary" icon={<Target />} onClick={() => navigate('/points')}>
                Điểm sự kiện
              </Button>
            </div>

            {enemy.abilities && enemy.abilities.length > 0 && (
              <Section title="Kỹ năng nguy hiểm">
                <Callout tone="danger">
                  <ul className="list-disc space-y-1 pl-4">
                    {enemy.abilities.map((ability, i) => (
                      <li key={i}>{ability}</li>
                    ))}
                  </ul>
                </Callout>
              </Section>
            )}

            {enemy.combatTips && enemy.combatTips.length > 0 && (
              <Section title="Mẹo chiến đấu">
                <ul className="space-y-2">
                  {enemy.combatTips.map((tip, i) => (
                    <li key={i} className="rounded-lg bg-subtle px-3 py-2 text-sm leading-relaxed">
                      {tip}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {enemy.locations.length > 0 && (
              <Section title="Xuất hiện tại">
                <ul className="flex flex-wrap gap-1.5">
                  {enemy.locations.map((id) => (
                    <li key={id}>
                      <Link
                        to={`/wiki/locations?select=${id}`}
                        className="inline-flex rounded-md bg-subtle px-2 py-1 text-xs hover:text-accent"
                      >
                        {db.locationsMap.get(id)?.name ?? id}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {enemy.drops.length > 0 && (
              <Section title="Vật phẩm rơi">
                <ul className="flex flex-wrap gap-1.5">
                  {enemy.drops.map((drop, i) => (
                    <li key={`${drop.itemId}-${i}`}>
                      <Link
                        to={`/wiki/items?select=${drop.itemId}`}
                        className="inline-flex gap-1 rounded-md bg-subtle px-2 py-1 text-xs hover:text-accent"
                      >
                        {db.itemsMap.get(drop.itemId)?.name ?? drop.itemId}
                        {drop.chance && <span className="text-faint">{drop.chance}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </>
        ),
      })}
    >
      <FormModal
        isOpen={Boolean(editing)}
        title={isNew ? 'Thêm quái vật' : 'Sửa quái vật'}
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
              <Field label="Loại">
                <Select value={editing.category} onChange={(e) => patch({ category: e.target.value as Enemy['category'] })}>
                  {Object.entries(ENEMY_CATEGORY_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tốc độ di chuyển">
                <Select
                  value={editing.movementSpeed ?? 'normal'}
                  onChange={(e) => patch({ movementSpeed: e.target.value as Enemy['movementSpeed'] })}
                >
                  {Object.entries(MOVEMENT_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
            </FormRow>
            <FormRow cols={3}>
              <Field label="Máu (HP)">
                <NumberInput value={editing.hp} onValueChange={(v) => patch({ hp: v })} />
              </Field>
              <Field label="Sát thương">
                <NumberInput value={editing.damage} onValueChange={(v) => patch({ damage: v })} />
              </Field>
              <Field label="Giáp" hint="0 – 100">
                <NumberInput max={100} value={editing.armor} onValueChange={(v) => patch({ armor: Math.min(100, v) })} />
              </Field>
            </FormRow>
            <FormRow>
              <Field label="Độ nguy hiểm">
                <Select
                  value={editing.dangerRating ?? 1}
                  onChange={(e) => patch({ dangerRating: Number(e.target.value) as Enemy['dangerRating'] })}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} / 5
                    </option>
                  ))}
                </Select>
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
            <ImageField folder="enemies" id={editing.id ?? ''} value={editing.image} onChange={(image) => patch({ image })} />
            <Field label="Mô tả">
              <Textarea value={editing.description ?? ''} onChange={(e) => patch({ description: e.target.value })} />
            </Field>
          </>
        )}
      </FormModal>
    </WikiPage>
  );
};
