import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronRight, Layers, MapPin, Scroll, Skull, Target } from 'lucide-react';
import { useGameData } from '../../context/DataContext';
import { Quest, QuestObjective } from '../../types';
import { Badge } from '../../components/common/Badge';
import { EntityImage } from '../../components/common/EntityImage';
import { ImageField } from '../../components/common/ImageField';
import { Field, Select, TextInput, Textarea } from '../../components/common/Field';
import { FormModal, FormRow } from '../../components/common/FormModal';
import { Section } from '../../components/common/Layout';
import { EntityTile, WikiPage, useSaveEntity } from '../../components/wiki';
import { OBJECTIVE_TYPE_LABEL, QUEST_CATEGORY_LABEL } from '../../lib/labels';

const FILTERS = [{ id: 'all', label: 'Tất cả' }, ...Object.entries(QUEST_CATEGORY_LABEL).map(([id, label]) => ({ id, label }))];

const newQuest = (): Partial<Quest> => ({
  id: `quest_custom_${Date.now()}`,
  title: '',
  vietnameseTitle: '',
  category: 'story',
  chapter: '',
  description: '',
  objectives: [{ id: 'obj_1', type: 'other', description: 'Mục tiêu mới', quantity: 1 }],
  rewards: [],
  instructions: '',
});

const objectiveIcon = (type: QuestObjective['type']) => {
  switch (type) {
    case 'kill_enemy':
      return <Skull />;
    case 'collect_item':
    case 'craft_item':
      return <Layers />;
    case 'visit_location':
      return <MapPin />;
    case 'repair_structure':
      return <Building2 />;
    default:
      return <Target />;
  }
};

/** Where an objective can be worked out: the tool or wiki page that matches its type. */
const objectiveLink = (obj: QuestObjective): { to: string; label: string } | null => {
  if (!obj.targetId) return null;
  switch (obj.type) {
    case 'kill_enemy':
      return { to: `/combat?enemy=${obj.targetId}&count=${obj.quantity || 1}`, label: 'Tính vũ khí' };
    case 'collect_item':
    case 'craft_item':
      return { to: `/planner?item=${obj.targetId}&qty=${obj.quantity || 1}`, label: 'Lên kế hoạch' };
    case 'repair_structure':
      return { to: `/construction?structure=${obj.targetId}`, label: 'Tính vật liệu' };
    case 'visit_location':
      return { to: `/wiki/locations?select=${obj.targetId}`, label: 'Xem địa điểm' };
    default:
      return null;
  }
};

export const QuestsPage: React.FC = () => {
  const { db } = useGameData();
  const save = useSaveEntity('customQuests');
  const [editing, setEditing] = useState<Partial<Quest> | null>(null);
  const [isNew, setIsNew] = useState(false);

  if (!db) return null;

  const patch = (changes: Partial<Quest>) => setEditing((prev) => (prev ? { ...prev, ...changes } : prev));

  const handleSave = async () => {
    if (!editing?.title?.trim() || !editing.id?.trim()) return;
    const entity = {
      ...editing,
      id: editing.id.trim(),
      title: editing.title.trim(),
      category: editing.category ?? 'story',
      description: editing.description ?? '',
      objectives: editing.objectives ?? [],
      rewards: editing.rewards ?? [],
      isCustom: true,
    } as Quest;
    await save(entity);
    setEditing(null);
  };

  return (
    <WikiPage<Quest>
      title="Nhiệm vụ"
      description="Mục tiêu, phần thưởng và công cụ liên quan cho từng nhiệm vụ."
      icon={<Scroll />}
      noun="nhiệm vụ"
      overrideKey="customQuests"
      entities={db.quests}
      searchPlaceholder="Tìm nhiệm vụ, chương..."
      getName={(q) => q.title}
      getSearchText={(q) => `${q.title} ${q.vietnameseTitle ?? ''} ${q.description} ${q.chapter ?? ''}`}
      filter={{ options: FILTERS, matches: (q, id) => q.category === id }}
      onEdit={(quest) => {
        setIsNew(!quest);
        setEditing(quest ? { ...quest } : newQuest());
      }}
      layout="tiles"
      renderCard={(quest, isSelected, onSelect) => (
        <EntityTile
          key={quest.id}
          folder="quests"
          id={quest.id}
          name={quest.title}
          hint={[quest.chapter, quest.vietnameseTitle].filter(Boolean).join(' · ') || undefined}
          image={quest.image}
          isSelected={isSelected}
          onClick={onSelect}
        />
      )}
      renderDetail={(quest) => ({
        title: quest.title,
        subtitle: quest.vietnameseTitle,
        badges: (
          <>
            <Badge tone="accent">{QUEST_CATEGORY_LABEL[quest.category]}</Badge>
            {quest.chapter && <Badge>{quest.chapter}</Badge>}
            {quest.isCustom && <Badge tone="info">Tùy chỉnh</Badge>}
          </>
        ),
        body: (
          <>
            <EntityImage folder="quests" id={quest.id} image={quest.image} alt={quest.title} />
            {quest.description && <p className="text-sm leading-relaxed text-muted">{quest.description}</p>}

            {quest.prerequisites && quest.prerequisites.length > 0 && (
              <Section title="Cần hoàn thành trước">
                <ul className="flex flex-wrap gap-1.5">
                  {quest.prerequisites.map((id) => (
                    <li key={id}>
                      <Link to={`/wiki/quests?select=${id}`} className="inline-flex rounded-md bg-subtle px-2 py-1 text-xs hover:text-accent">
                        {db.questsMap.get(id)?.title ?? id}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title={`Mục tiêu (${quest.objectives.length})`}>
              <ul className="divide-y divide-line rounded-lg border border-line">
                {quest.objectives.map((obj, index) => {
                  const link = objectiveLink(obj);
                  return (
                    <li key={obj.id || index} className="flex items-center gap-3 px-3 py-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-subtle text-muted [&>svg]:h-3.5 [&>svg]:w-3.5">
                        {objectiveIcon(obj.type)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{obj.description}</div>
                        <div className="num text-xs text-muted">
                          {OBJECTIVE_TYPE_LABEL[obj.type]}
                          {obj.quantity ? ` · ×${obj.quantity}` : ''}
                        </div>
                      </div>
                      {link && (
                        <Link
                          to={link.to}
                          className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-accent hover:underline"
                        >
                          {link.label}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Section>

            {quest.rewards.length > 0 && (
              <Section title="Phần thưởng">
                <ul className="flex flex-wrap gap-1.5">
                  {quest.rewards.map((reward, i) => (
                    <li key={`${reward.itemId}-${i}`}>
                      <Link
                        to={`/wiki/items?select=${reward.itemId}`}
                        className="num inline-flex gap-1.5 rounded-md bg-accent-soft px-2 py-1 text-xs text-accent hover:brightness-95"
                      >
                        {db.itemsMap.get(reward.itemId)?.name ?? reward.itemId}
                        <span className="font-semibold">×{reward.quantity}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {quest.instructions && (
              <Section title="Hướng dẫn & mẹo">
                <p className="whitespace-pre-line rounded-lg bg-subtle p-3 text-sm leading-relaxed text-muted">{quest.instructions}</p>
              </Section>
            )}
          </>
        ),
      })}
    >
      <FormModal
        isOpen={Boolean(editing)}
        title={isNew ? 'Thêm nhiệm vụ' : 'Sửa nhiệm vụ'}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        saveDisabled={!editing?.title?.trim()}
      >
        {editing && (
          <>
            <FormRow>
              <Field label="Tên (tiếng Anh)">
                <TextInput autoFocus value={editing.title ?? ''} onChange={(e) => patch({ title: e.target.value })} />
              </Field>
              <Field label="Tên tiếng Việt" hint="Không bắt buộc">
                <TextInput value={editing.vietnameseTitle ?? ''} onChange={(e) => patch({ vietnameseTitle: e.target.value })} />
              </Field>
            </FormRow>
            <FormRow>
              <Field label="Phân loại">
                <Select value={editing.category} onChange={(e) => patch({ category: e.target.value as Quest['category'] })}>
                  {Object.entries(QUEST_CATEGORY_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Chương / Act">
                <TextInput value={editing.chapter ?? ''} onChange={(e) => patch({ chapter: e.target.value })} placeholder="Chương 1" />
              </Field>
            </FormRow>
            <ImageField folder="quests" id={editing.id ?? ''} value={editing.image} onChange={(image) => patch({ image })} />
            <Field label="Mô tả">
              <Textarea value={editing.description ?? ''} onChange={(e) => patch({ description: e.target.value })} />
            </Field>
            <Field label="Hướng dẫn / mẹo">
              <Textarea value={editing.instructions ?? ''} onChange={(e) => patch({ instructions: e.target.value })} />
            </Field>
          </>
        )}
      </FormModal>
    </WikiPage>
  );
};
