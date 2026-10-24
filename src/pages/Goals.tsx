import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameData } from '../context/DataContext';
import { usePersonalData } from '../hooks/usePersonalData';
import { Goal } from '../types';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  Clock,
  ArrowRight,
  Package,
} from 'lucide-react';

export const Goals: React.FC = () => {
  const { db } = useGameData();
  const { goals, addGoal, toggleGoal, removeGoal, inventory } = usePersonalData();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [targetItemId, setTargetItemId] = useState('machete');
  const [targetQuantity, setTargetQuantity] = useState(1);
  const [goalNotes, setGoalNotes] = useState('');

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  const handleSaveGoal = () => {
    if (!targetItemId) return;
    const title = goalTitle.trim() || `Chế tạo ${targetQuantity}x ${db?.itemsMap.get(targetItemId)?.name || targetItemId}`;
    addGoal(title, targetItemId, targetQuantity, goalNotes);
    setIsModalOpen(false);
    setGoalTitle('');
    setTargetQuantity(1);
    setGoalNotes('');
  };

  const renderGoalCard = (goal: Goal) => {
    const item = db?.itemsMap.get(goal.targetItemId);
    const inStock = inventory[goal.targetItemId] || 0;
    const progressPercent = Math.min(100, Math.round((inStock / goal.targetQuantity) * 100));

    return (
      <Card
        key={goal.id}
        highlight={goal.completed ? 'olive' : inStock >= goal.targetQuantity ? 'amber' : 'none'}
        className="space-y-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <button
              onClick={() => toggleGoal(goal.id)}
              className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <CheckCircle2
                className={`w-5 h-5 ${
                  goal.completed ? 'text-emerald-400 fill-emerald-950' : 'text-slate-600'
                }`}
              />
            </button>
            <div>
              <h3
                className={`font-bold text-sm sm:text-base ${
                  goal.completed ? 'line-through text-slate-500' : 'text-slate-100'
                }`}
              >
                {goal.title}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Mục tiêu: {goal.targetQuantity}x {item?.name || goal.targetItemId}
              </p>
              {goal.notes && (
                <p className="text-xs text-slate-400 mt-1 italic">"{goal.notes}"</p>
              )}
            </div>
          </div>

          <button
            onClick={() => removeGoal(goal.id)}
            className="p-1 text-slate-500 hover:text-red-400"
            title="Xóa mục tiêu"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Progress against inventory */}
        <div className="space-y-1.5 pt-2 border-t border-charcoal-800 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-500" /> Tiến độ kho:
            </span>
            <span
              className={`font-bold ${
                inStock >= goal.targetQuantity ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {inStock} / {goal.targetQuantity} ({progressPercent}%)
            </span>
          </div>

          <div className="w-full h-1.5 bg-charcoal-950 rounded-full overflow-hidden border border-charcoal-800">
            <div
              className={`h-full transition-all ${
                progressPercent >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Link to Planner */}
        <div className="pt-2 border-t border-charcoal-800/80 flex items-center justify-between">
          <Button
            size="sm"
            variant="ghost"
            icon={<Layers className="w-3.5 h-3.5 text-amber-500" />}
            onClick={() => navigate(`/planner?item=${goal.targetItemId}&qty=${goal.targetQuantity}`)}
            className="text-xs text-amber-400 hover:text-amber-300 -ml-2"
          >
            Mở kế hoạch chế tạo (Planner)
          </Button>
          <span className="text-[10px] font-mono text-slate-500">
            {new Date(goal.createdAt).toLocaleDateString('vi-VN')}
          </span>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Target className="w-6 h-6 text-amber-500" />
            Mục tiêu cá nhân (Personal Goals)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Đặt mục tiêu chế tạo súng, giáp, nâng cấp căn cứ và đối chiếu tiến độ nguyên liệu.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Tạo mục tiêu mới
        </Button>
      </div>

      {/* Active Goals Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-amber-500 font-semibold flex items-center gap-2">
          ĐANG THỰC HIỆN ({activeGoals.length})
        </h3>
        {activeGoals.length === 0 ? (
          <Card className="text-center py-8 text-slate-500">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
            <p className="text-sm">Hiện tại bạn chưa có mục tiêu nào đang thực hiện.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setIsModalOpen(true)}
            >
              Tạo mục tiêu ngay
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map(renderGoalCard)}
          </div>
        )}
      </div>

      {/* Completed Goals Section */}
      {completedGoals.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-charcoal-800">
          <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-2">
            ĐÃ HOÀN THÀNH ({completedGoals.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
            {completedGoals.map(renderGoalCard)}
          </div>
        </div>
      )}

      {/* Modal: Create Goal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tạo mục tiêu cá nhân mới"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">
              Vật phẩm mục tiêu:
            </label>
            <select
              value={targetItemId}
              onChange={(e) => setTargetItemId(e.target.value)}
              className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-amber-500 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none"
            >
              {db?.items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">
              Số lượng cần đạt:
            </label>
            <input
              type="number"
              min="1"
              value={targetQuantity}
              onChange={(e) => setTargetQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-amber-500 rounded px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">
              Tên tiêu đề mục tiêu (tùy chọn):
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Gom đủ 5 cây Machete đi farm hầm Alfa"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-amber-500 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">
              Ghi chú thêm:
            </label>
            <textarea
              rows={2}
              placeholder="Cần ưu tiên nung sắt trước..."
              value={goalNotes}
              onChange={(e) => setGoalNotes(e.target.value)}
              className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-amber-500 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-charcoal-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSaveGoal}>
              Tạo mục tiêu
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
