import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bike, Building2, ChevronRight, MapPin } from 'lucide-react';
import { useGameData } from '../../context/DataContext';
import { Location } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EntityImage } from '../../components/common/EntityImage';
import { ImageField } from '../../components/common/ImageField';
import { Checkbox, Field, NumberInput, Select, TextInput, Textarea } from '../../components/common/Field';
import { FormModal, FormRow } from '../../components/common/FormModal';
import { Callout, Section, Stat, StatGrid } from '../../components/common/Layout';
import { EntityTile, WikiPage, useSaveEntity } from '../../components/wiki';
import { dangerTone, LOCATION_DIFFICULTY_LABEL, LOCATION_DIFFICULTY_TONE } from '../../lib/labels';

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'easy', label: 'Vùng xanh' },
  { id: 'medium', label: 'Vùng vàng' },
  { id: 'hard', label: 'Vùng đỏ' },
  { id: 'bunker', label: 'Bunker' },
  { id: 'event', label: 'Sự kiện' },
];

const newLocation = (): Partial<Location> => ({
  id: `location_custom_${Date.now()}`,
  name: '',
  vietnameseName: '',
  difficulty: 'easy',
  dangerLevel: 1,
  description: '',
  enemies: [],
  resources: [],
  loot: [],
  energyCost: 15,
  requiresChopper: false,
});

export const LocationsPage: React.FC = () => {
  const { db } = useGameData();
  const navigate = useNavigate();
  const save = useSaveEntity('customLocations');
  const [editing, setEditing] = useState<Partial<Location> | null>(null);
  const [isNew, setIsNew] = useState(false);

  if (!db) return null;

  const patch = (changes: Partial<Location>) => setEditing((prev) => (prev ? { ...prev, ...changes } : prev));

  const handleSave = async () => {
    if (!editing?.name?.trim() || !editing.id?.trim()) return;
    const entity = {
      ...editing,
      id: editing.id.trim(),
      name: editing.name.trim(),
      difficulty: editing.difficulty ?? 'easy',
      dangerLevel: Math.min(5, Math.max(1, editing.dangerLevel || 1)),
      description: editing.description ?? '',
      enemies: editing.enemies ?? [],
      resources: editing.resources ?? [],
      loot: editing.loot ?? [],
      energyCost: editing.energyCost || undefined,
      resetTimeHours: editing.resetTimeHours || undefined,
      isCustom: true,
    } as Location;
    await save(entity);
    setEditing(null);
  };

  return (
    <WikiPage<Location>
      title="Địa điểm"
      description="Khu vực, hầm ngầm và công trình: quái, tài nguyên và loot."
      icon={<MapPin />}
      noun="địa điểm"
      overrideKey="customLocations"
      entities={db.locations}
      searchPlaceholder="Tìm địa điểm..."
      getName={(l) => l.name}
      getSearchText={(l) => `${l.name} ${l.vietnameseName ?? ''} ${l.id}`}
      filter={{ options: FILTERS, matches: (l, id) => l.difficulty === id }}
      onEdit={(loc) => {
        setIsNew(!loc);
        setEditing(loc ? { ...loc } : newLocation());
      }}
      layout="tiles"
      renderCard={(loc, isSelected, onSelect) => (
        <EntityTile
          key={loc.id}
          folder="locations"
          id={loc.id}
          name={loc.name}
          hint={loc.vietnameseName}
          image={loc.image}
          tone={LOCATION_DIFFICULTY_TONE[loc.difficulty]}
          isSelected={isSelected}
          onClick={onSelect}
        />
      )}
      renderDetail={(loc) => {
        const structures = db.locationStructures.filter((s) => s.locationId === loc.id);
        const itemIds = Array.from(new Set([...loc.resources, ...loc.loot]));

        return {
          title: loc.name,
          subtitle: loc.vietnameseName,
          badges: (
            <>
              <Badge tone={LOCATION_DIFFICULTY_TONE[loc.difficulty]}>{LOCATION_DIFFICULTY_LABEL[loc.difficulty]}</Badge>
              <Badge tone={dangerTone(loc.dangerLevel)}>{'💀'.repeat(loc.dangerLevel)}</Badge>
              {loc.requiresChopper && <Badge tone="info">Cần Chopper</Badge>}
              {loc.isCustom && <Badge tone="accent">Tùy chỉnh</Badge>}
            </>
          ),
          body: (
            <>
              <EntityImage folder="locations" id={loc.id} image={loc.image} alt={loc.name} />
              {loc.description && <p className="text-sm leading-relaxed text-muted">{loc.description}</p>}

              {(loc.energyCost || loc.resetTimeHours) && (
                <StatGrid cols={3}>
                  <Stat label="Nguy hiểm" value={`${loc.dangerLevel}/5`} tone={dangerTone(loc.dangerLevel)} />
                  {loc.energyCost ? <Stat label="Năng lượng" value={loc.energyCost} /> : null}
                  {loc.resetTimeHours ? <Stat label="Làm mới" value={loc.resetTimeHours} unit="giờ" /> : null}
                </StatGrid>
              )}

              {loc.notes && <Callout tone="warn">{loc.notes}</Callout>}

              {structures.length > 0 && (
                <Section title={`Công trình & Cơ chế tại đây (${structures.length})`}>
                  <ul className="space-y-2">
                    {structures.map((s) => {
                      const isRecurring = s.frequency === 'recurring' || Boolean(s.cycleConfig);
                      const isChopper = s.id === 'struct_gas_station_chopper' || s.cycleConfig?.progressionType === 'vehicle_exp';

                      return (
                        <li key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-line p-3 bg-subtle/30">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                              {isChopper ? (
                                <Bike className="h-4 w-4 shrink-0 text-accent" />
                              ) : (
                                <Building2 className="h-4 w-4 shrink-0 text-muted" />
                              )}
                              <span className="truncate">{s.vietnameseName || s.name}</span>
                              <Badge tone={isRecurring ? 'info' : 'ok'} size="sm">
                                {isRecurring ? `Định kỳ · Reset ${s.cycleConfig?.resetHours ?? 24}h` : 'Vĩnh viễn · 1 lần'}
                              </Badge>
                            </div>
                            <div className="mt-1 text-xs text-muted line-clamp-2">
                              {s.description || (isRecurring ? 'Cơ chế nộp nguyên liệu định kỳ' : `${s.stages.length} giai đoạn hoàn thành`)}
                            </div>
                          </div>

                          <div className="shrink-0 self-end sm:self-auto">
                            {isChopper ? (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => navigate('/construction?location=gas_station&structure=struct_gas_station_chopper')}
                              >
                                <Bike className="h-3.5 w-3.5" />
                                Xem nâng cấp Chopper
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => navigate(`/construction?location=${loc.id}&structure=${s.id}`)}
                              >
                                Xem nguyên liệu nộp
                              </Button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Section>
              )}

              {loc.enemies.length > 0 && (
                <Section title={`Quái xuất hiện (${loc.enemies.length})`}>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {loc.enemies.map((id) => {
                      const enemy = db.enemiesMap.get(id);
                      return (
                        <li key={id}>
                          <Link
                            to={`/wiki/enemies?select=${id}`}
                            className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 hover:bg-subtle"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">{enemy?.name ?? id}</span>
                              {enemy && (
                                <span className="num block text-xs text-muted">
                                  {enemy.hp} HP · {enemy.damage} dmg
                                </span>
                              )}
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-faint" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </Section>
              )}

              {itemIds.length > 0 && (
                <Section title="Tài nguyên & loot">
                  <ul className="flex flex-wrap gap-1.5">
                    {itemIds.map((id) => (
                      <li key={id}>
                        <Link
                          to={`/wiki/items?select=${id}`}
                          className="inline-flex rounded-md bg-subtle px-2 py-1 text-xs hover:text-accent"
                        >
                          {db.itemsMap.get(id)?.name ?? id}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </>
          ),
        };
      }}
    >
      <FormModal
        isOpen={Boolean(editing)}
        title={isNew ? 'Thêm địa điểm' : 'Sửa địa điểm'}
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
              <Field label="Độ khó">
                <Select value={editing.difficulty} onChange={(e) => patch({ difficulty: e.target.value as Location['difficulty'] })}>
                  {Object.entries(LOCATION_DIFFICULTY_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Mức nguy hiểm">
                <Select value={editing.dangerLevel ?? 1} onChange={(e) => patch({ dangerLevel: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} / 5
                    </option>
                  ))}
                </Select>
              </Field>
            </FormRow>
            <FormRow cols={3}>
              <Field label="Năng lượng">
                <NumberInput value={editing.energyCost} onValueChange={(v) => patch({ energyCost: v || undefined })} />
              </Field>
              <Field label="Làm mới (giờ)">
                <NumberInput value={editing.resetTimeHours} onValueChange={(v) => patch({ resetTimeHours: v || undefined })} />
              </Field>
              <Field label="ID" hint={isNew ? 'Duy nhất' : 'Không đổi được'}>
                <TextInput
                  value={editing.id ?? ''}
                  disabled={!isNew}
                  onChange={(e) => patch({ id: e.target.value })}
                  className="font-mono"
                />
              </Field>
            </FormRow>
            <Checkbox
              checked={Boolean(editing.requiresChopper)}
              onChange={(checked) => patch({ requiresChopper: checked })}
              label="Cần Chopper để tới"
            />
            <ImageField folder="locations" id={editing.id ?? ''} value={editing.image} onChange={(image) => patch({ image })} />
            <Field label="Mô tả">
              <Textarea value={editing.description ?? ''} onChange={(e) => patch({ description: e.target.value })} />
            </Field>
            <Field label="Lưu ý tác chiến">
              <Textarea rows={2} value={editing.notes ?? ''} onChange={(e) => patch({ notes: e.target.value })} />
            </Field>
          </>
        )}
      </FormModal>
    </WikiPage>
  );
};
