import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGameData } from '../context/DataContext';
import { usePersonalData } from '../hooks/usePersonalData';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  ShieldAlert,
  Target,
  Scroll,
  Calculator,
  Layers,
  Package,
  Sword,
  Skull,
  Star,
  Clock,
  ArrowRight,
  Pin,
  CheckCircle2,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { db } = useGameData();
  const {
    inventory,
    goals,
    questProgress,
    notes,
    favorites,
    recentlyViewed,
  } = usePersonalData();
  const navigate = useNavigate();

  const activeGoals = goals.filter((g) => !g.completed).slice(0, 3);
  const inProgressQuests = Object.entries(questProgress)
    .filter(([_, q]) => q.status === 'in_progress')
    .map(([id]) => db?.questsMap.get(id))
    .filter(Boolean)
    .slice(0, 3);

  const pinnedNotes = notes.filter((n) => n.isPinned).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-charcoal-900 via-charcoal-850 to-charcoal-900 border border-charcoal-800 p-5 sm:p-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="amber">KHU VỰC SINH TỒN</Badge>
              <span className="text-xs font-mono text-slate-400">Tactical Companion OS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              Last Day on Earth — Bảng tin tác chiến
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Trợ lý thông minh hỗ trợ tra cứu thông số game chuẩn xác, tính toán vũ khí hạ gục zombie và lên kế hoạch gom tài nguyên chế tạo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="sm"
              icon={<Calculator className="w-4 h-4" />}
              onClick={() => navigate('/combat')}
            >
              Máy tính chiến đấu
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Layers className="w-4 h-4" />}
              onClick={() => navigate('/planner')}
            >
              Kế hoạch chế tạo
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/combat"
          className="p-3.5 rounded-lg bg-charcoal-900 border border-charcoal-800 hover:border-amber-500/50 hover:bg-charcoal-850 transition-all flex items-center gap-3 group"
        >
          <div className="p-2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-amber-400">
              Combat Calc
            </h4>
            <p className="text-[11px] text-slate-400">Số đòn & độ bền</p>
          </div>
        </Link>

        <Link
          to="/planner"
          className="p-3.5 rounded-lg bg-charcoal-900 border border-charcoal-800 hover:border-blue-500/50 hover:bg-charcoal-850 transition-all flex items-center gap-3 group"
        >
          <div className="p-2 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-blue-400">
              Craft Planner
            </h4>
            <p className="text-[11px] text-slate-400">Phân rã nguyên liệu</p>
          </div>
        </Link>

        <Link
          to="/inventory"
          className="p-3.5 rounded-lg bg-charcoal-900 border border-charcoal-800 hover:border-emerald-500/50 hover:bg-charcoal-850 transition-all flex items-center gap-3 group"
        >
          <div className="p-2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-emerald-400">
              Kho đồ cá nhân
            </h4>
            <p className="text-[11px] text-slate-400">{Object.keys(inventory).length} loại tài nguyên</p>
          </div>
        </Link>

        <Link
          to="/wiki/enemies"
          className="p-3.5 rounded-lg bg-charcoal-900 border border-charcoal-800 hover:border-red-500/50 hover:bg-charcoal-850 transition-all flex items-center gap-3 group"
        >
          <div className="p-2 rounded bg-red-950/60 text-red-400 border border-red-800/40">
            <Skull className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-red-400">
              Xác sống & Boss
            </h4>
            <p className="text-[11px] text-slate-400">Tra cứu thông số quái</p>
          </div>
        </Link>
      </div>

      {/* Main Dashboard Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Goals & Quests */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Goals */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-amber-500 font-semibold flex items-center gap-1.5">
                <Target className="w-4 h-4" /> MỤC TIÊU ĐANG THỰC HIỆN ({activeGoals.length})
              </h3>
              <Link to="/goals" className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1">
                Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {activeGoals.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Chưa có mục tiêu nào. Hãy vào Kế hoạch chế tạo hoặc trang Mục tiêu để tạo mới!
              </p>
            ) : (
              <div className="space-y-2.5">
                {activeGoals.map((g) => {
                  const inStock = inventory[g.targetItemId] || 0;
                  const percent = Math.min(100, Math.round((inStock / g.targetQuantity) * 100));
                  return (
                    <div
                      key={g.id}
                      onClick={() => navigate(`/planner?item=${g.targetItemId}&qty=${g.targetQuantity}`)}
                      className="p-3 rounded-lg bg-charcoal-950 border border-charcoal-800 hover:border-charcoal-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-200">{g.title}</span>
                        <span className="font-mono text-amber-400 font-bold">
                          {inStock}/{g.targetQuantity} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-charcoal-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* In-Progress Quests */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold flex items-center gap-1.5">
                <Scroll className="w-4 h-4" /> NHIỆM VỤ ĐANG LÀM ({inProgressQuests.length})
              </h3>
              <Link to="/quests" className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1">
                Xem chuỗi nhiệm vụ <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {inProgressQuests.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Không có nhiệm vụ nào đang tiến hành.
              </p>
            ) : (
              <div className="space-y-2.5">
                {inProgressQuests.map((q: any) => {
                  const prog = questProgress[q.id];
                  const doneSteps = prog?.completedStepIds.length || 0;
                  const total = q.steps.length;
                  return (
                    <div
                      key={q.id}
                      onClick={() => navigate(`/quests?select=${q.id}`)}
                      className="p-3 rounded-lg bg-charcoal-950 border border-charcoal-800 hover:border-charcoal-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-200">{q.title}</span>
                        <span className="font-mono text-blue-400 font-bold">
                          {doneSteps}/{total} bước
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{q.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Pinned Notes & Favorites */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pinned Tactical Notes */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-amber-500 font-semibold flex items-center gap-1.5">
                <Pin className="w-4 h-4 fill-amber-500" /> GHI CHÚ GHIM TÁC CHIẾN
              </h3>
              <Link to="/notes" className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1">
                Sổ tay <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pinnedNotes.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                Chưa có ghi chú nào được ghim.
              </p>
            ) : (
              <div className="space-y-2.5">
                {pinnedNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => navigate('/notes')}
                    className="p-3 rounded-lg bg-charcoal-950 border border-charcoal-800 hover:border-amber-500/40 cursor-pointer transition-colors"
                  >
                    <h4 className="font-bold text-xs text-slate-200 mb-1">{note.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Favorites & Quick Jump */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> MỤC YÊU THÍCH ({favorites.length})
              </h3>
            </div>

            {favorites.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                Bấm biểu tượng ngôi sao ở các vật phẩm hoặc quái vật để lưu truy cập nhanh tại đây.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {favorites.map((fav) => {
                  let name = fav.id;
                  let url = '/';
                  if (fav.type === 'item') {
                    name = db?.itemsMap.get(fav.id)?.name || fav.id;
                    url = `/wiki/items?select=${fav.id}`;
                  } else if (fav.type === 'enemy') {
                    name = db?.enemiesMap.get(fav.id)?.name || fav.id;
                    url = `/wiki/enemies?select=${fav.id}`;
                  }
                  return (
                    <Link
                      key={`${fav.type}_${fav.id}`}
                      to={url}
                      className="px-2.5 py-1 rounded bg-charcoal-950 border border-charcoal-800 hover:border-amber-500/50 text-xs text-slate-300 hover:text-amber-400 transition-colors"
                    >
                      ★ {name}
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
