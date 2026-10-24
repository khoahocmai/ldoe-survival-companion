import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Item, WeaponMod, WeaponModSlot, WeaponModStatBonus } from '../../types';
import { Button, IconButton } from '../common/Button';
import { Field, NumberInput, Select, TextInput, Textarea } from '../common/Field';
import { FormModal, FormRow } from '../common/FormModal';
import { Section } from '../common/Layout';
import { WEAPON_MOD_RARITY_LABEL, WEAPON_MOD_SLOT_LABEL } from '../../lib/labels';

interface ModFormModalProps {
  mod: Partial<WeaponMod> | null;
  isNew: boolean;
  weapons: Item[];
  items: Item[];
  onChange: (changes: Partial<WeaponMod>) => void;
  onSave: () => void;
  onClose: () => void;
}

const STAT_FIELDS: Array<{ key: keyof WeaponModStatBonus; label: string; step?: number }> = [
  { key: 'damage', label: 'Sát thương' },
  { key: 'attackSpeed', label: 'Tốc đánh (/s)', step: 0.01 },
  { key: 'durability', label: 'Độ bền' },
  { key: 'critChance', label: 'Chí mạng (%)' },
  { key: 'critDamage', label: 'Dmg chí mạng (%)' },
  { key: 'stability', label: 'Độ ổn định' },
  { key: 'noise', label: 'Độ ồn (%)' },
  { key: 'range', label: 'Tầm', step: 0.1 },
];

export const ModFormModal: React.FC<ModFormModalProps> = ({ mod, isNew, weapons, items, onChange, onSave, onClose }) => {
  const materials = mod?.materials ?? [];
  const setMaterial = (index: number, changes: Partial<{ itemId: string; quantity: number }>) =>
    onChange({ materials: materials.map((m, i) => (i === index ? { ...m, ...changes } : m)) });

  const setStat = (key: keyof WeaponModStatBonus, value: number) =>
    onChange({ stats: { ...mod?.stats, [key]: value || undefined } });

  return (
    <FormModal
      isOpen={Boolean(mod)}
      title={isNew ? 'Thêm bản độ' : 'Sửa bản độ'}
      onClose={onClose}
      onSave={onSave}
      saveDisabled={!mod?.name?.trim() || !mod?.id?.trim() || !mod?.weaponId}
      maxWidth="xl"
    >
      {mod && (
        <>
          <FormRow>
            <Field label="Vũ khí">
              <Select value={mod.weaponId} onChange={(e) => onChange({ weaponId: e.target.value })}>
                {weapons.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Vị trí lắp">
              <Select value={mod.slot} onChange={(e) => onChange({ slot: e.target.value as WeaponModSlot })}>
                {Object.entries(WEAPON_MOD_SLOT_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </FormRow>

          <FormRow>
            <Field label="Tên (tiếng Anh)">
              <TextInput autoFocus value={mod.name ?? ''} onChange={(e) => onChange({ name: e.target.value })} />
            </Field>
            <Field label="Tên tiếng Việt" hint="Không bắt buộc">
              <TextInput value={mod.vietnameseName ?? ''} onChange={(e) => onChange({ vietnameseName: e.target.value })} />
            </Field>
          </FormRow>

          <FormRow>
            <Field label="Độ hiếm bản vẽ">
              <Select value={mod.rarity} onChange={(e) => onChange({ rarity: e.target.value as WeaponMod['rarity'] })}>
                {Object.entries(WEAPON_MOD_RARITY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="ID" hint={isNew ? 'Duy nhất, viết thường không dấu' : 'Không đổi được khi sửa'}>
              <TextInput
                value={mod.id ?? ''}
                disabled={!isNew}
                onChange={(e) => onChange({ id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                className="font-mono"
              />
            </Field>
          </FormRow>

          <Section title="Chỉ số cộng thêm" description="Số âm để giảm. Để trống nếu không đổi.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STAT_FIELDS.map(({ key, label, step }) => (
                <Field key={key} label={label}>
                  <NumberInput
                    min={-9999}
                    step={step}
                    placeholder="0"
                    value={mod.stats?.[key]}
                    onValueChange={(v) => setStat(key, v)}
                  />
                </Field>
              ))}
            </div>
          </Section>

          <Section
            title="Nguyên liệu"
            action={
              <Button
                size="sm"
                variant="ghost"
                icon={<Plus />}
                onClick={() => onChange({ materials: [...materials, { itemId: items[0]?.id ?? '', quantity: 1 }] })}
              >
                Thêm
              </Button>
            }
          >
            {materials.length === 0 ? (
              <p className="text-sm text-muted">Chưa có nguyên liệu.</p>
            ) : (
              <ul className="space-y-2">
                {materials.map((mat, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Select
                      aria-label="Nguyên liệu"
                      value={mat.itemId}
                      onChange={(e) => setMaterial(index, { itemId: e.target.value })}
                      className="flex-1"
                    >
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </Select>
                    <NumberInput
                      aria-label="Số lượng"
                      min={1}
                      value={mat.quantity}
                      onValueChange={(v) => setMaterial(index, { quantity: Math.max(1, Math.floor(v)) })}
                      className="w-20"
                    />
                    <IconButton label="Xóa nguyên liệu" onClick={() => onChange({ materials: materials.filter((_, i) => i !== index) })}>
                      <Trash2 />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Field label="Kỹ năng đặc biệt" hint="Nếu bản độ có kỹ năng kích hoạt">
            <TextInput value={mod.activeSkill ?? ''} onChange={(e) => onChange({ activeSkill: e.target.value })} />
          </Field>
          <Field label="Nguồn bản vẽ">
            <TextInput
              value={mod.obtainDescription ?? ''}
              onChange={(e) => onChange({ obtainDescription: e.target.value })}
              placeholder="Rương xanh Farm, thẻ PD..."
            />
          </Field>
          <Field label="Mô tả">
            <Textarea rows={2} value={mod.description ?? ''} onChange={(e) => onChange({ description: e.target.value })} />
          </Field>
        </>
      )}
    </FormModal>
  );
};
