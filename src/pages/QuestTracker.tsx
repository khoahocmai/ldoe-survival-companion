import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGameData } from '../context/DataContext';
import { usePersonalData } from '../hooks/usePersonalData';
import { Quest, QuestStep } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { SearchInput } from '../components/common/SearchInput';
import {
  Scroll,
  CheckCircle2,
  Clock,
  AlertCircle,
  Gift,
  RotateCcw,
  Play,
  Check,
} from 'lucide-react';

export const QuestTracker: React.FC = () => {
  const { db } = useGameData();
  const { questProgress, setQuestStepCompleted, setQuestStatus } = usePersonalData();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const selectedQuestId = searchParams.get('select');

  const questsList = useMemo(() => {
    if (!db) return [];
    return db.quests.filter((q) => {
      const progress = questProgress[q.id];
      const status = progress?.status || 'not_started';

      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchTitle = q.title.toLowerCase().includes(query);
        const matchVn = q.vietnameseTitle?.toLowerCase().includes(query);
        const matchDesc = q.description.toLowerCase().includes(query);
        if (!matchTitle && !matchVn && !matchDesc) return false;
      }

      return true;
    });
  }, [db, questProgress, statusFilter, categoryFilter, search]);

  const getStatusBadge = (status: 'not_started' | 'in_progress' | 'completed') => {
    switch (status) {
      case 'completed':
        return <Badge variant="olive">Đã hoàn thành</Badge>;
      case 'in_progress':
        return <Badge variant="amber">Đang thực hiện</Badge>;
      default:
        return <Badge variant="charcoal">Chưa bắt đầu</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Scroll className="w-6 h-6 text-amber-500" />
            Theo dõi nhiệm vụ (Quest Tracker)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Theo dõi hành trình Survivor's Path, nhiệm vụ Raider và phần thưởng vũ khí tài nguyên.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-charcoal-900 border border-charcoal-800 px-3 py-1.5 rounded-lg w-fit">
          Tổng số: <span className="text-amber-400 font-bold">{questsList.length}</span> nhiệm vụ
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm nhiệm vụ (Act 1, Raider, Bunker...)"
          className="flex-1"
        />
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'in_progress', label: 'Đang làm' },
            { id: 'completed', label: 'Đã xong' },
            { id: 'not_started', label: 'Chưa làm' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-amber-600 text-charcoal-950 font-bold'
                  : 'bg-charcoal-900 text-slate-400 hover:text-slate-200 border border-charcoal-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quests List */}
      <div className="space-y-4">
        {questsList.map((quest) => {
          const progress = questProgress[quest.id] || {
            status: 'not_started',
            completedStepIds: [],
          };
          const completedCount = progress.completedStepIds.length;
          const totalSteps = quest.steps.length;
          const percent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
          const isSelected = selectedQuestId === quest.id;

          return (
            <Card
              key={quest.id}
              highlight={isSelected ? 'amber' : progress.status === 'completed' ? 'olive' : 'none'}
              className="space-y-4"
            >
              {/* Quest Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-slate-100">{quest.title}</h3>
                    {quest.chapter && (
                      <span className="text-xs font-mono text-amber-500 font-medium">
                        [{quest.chapter}]
                      </span>
                    )}
                    {getStatusBadge(progress.status)}
                  </div>
                  {quest.vietnameseTitle && (
                    <p className="text-xs text-slate-400 mb-1">{quest.vietnameseTitle}</p>
                  )}
                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                    {quest.description}
                  </p>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {progress.status !== 'in_progress' && progress.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Play className="w-3.5 h-3.5" />}
                      onClick={() => setQuestStatus(quest.id, 'in_progress')}
                    >
                      Bắt đầu làm
                    </Button>
                  )}
                  {progress.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Check className="w-3.5 h-3.5 text-emerald-400" />}
                      onClick={() => setQuestStatus(quest.id, 'completed')}
                    >
                      Hoàn thành toàn bộ
                    </Button>
                  )}
                  {progress.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<RotateCcw className="w-3.5 h-3.5" />}
                      onClick={() => setQuestStatus(quest.id, 'in_progress')}
                      title="Đặt lại trạng thái"
                    >
                      Làm lại
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Tiến độ nhiệm vụ:</span>
                  <span className="text-amber-400 font-bold">
                    {completedCount}/{totalSteps} bước ({percent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-charcoal-950 rounded-full overflow-hidden border border-charcoal-800">
                  <div
                    className={`h-full transition-all ${
                      percent === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Steps Checklist */}
              <div className="space-y-2 pt-2 border-t border-charcoal-800/80">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
                  CÁC BƯỚC THỰC HIỆN:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {quest.steps.map((step) => {
                    const isStepDone = progress.completedStepIds.includes(step.id);
                    return (
                      <label
                        key={step.id}
                        onClick={() => setQuestStepCompleted(quest.id, step.id, !isStepDone)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none transition-colors ${
                          isStepDone
                            ? 'bg-charcoal-950/40 border-charcoal-800/50 opacity-70'
                            : 'bg-charcoal-950 border-charcoal-800 hover:border-charcoal-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isStepDone}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-charcoal-700 text-amber-600 focus:ring-0 w-4 h-4 cursor-pointer shrink-0"
                        />
                        <span
                          className={`text-xs ${
                            isStepDone ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          {step.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Quest Rewards */}
              {quest.rewards && quest.rewards.length > 0 && db && (
                <div className="flex items-center gap-2 pt-2 border-t border-charcoal-800/80 text-xs font-mono">
                  <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-slate-400">Phần thưởng:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {quest.rewards.map((rew, idx) => {
                      const item = db.itemsMap.get(rew.itemId);
                      return (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-charcoal-950 border border-charcoal-800 text-[11px] text-amber-300 font-bold"
                        >
                          {item?.name || rew.itemId} x{rew.quantity}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
