import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGameData } from '../../context/DataContext';
import { usePersonalData } from '../../hooks/usePersonalData';
import { Enemy } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/common/Modal';
import {
  Skull,
  Shield,
  Activity,
  Zap,
  Star,
  Calculator,
  ChevronRight,
  MapPin,
  AlertTriangle,
} from 'lucide-react';

export const EnemiesPage: React.FC = () => {
  const { db } = useGameData();
  const { isFavorite, toggleFavorite } = usePersonalData();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedEnemy, setSelectedEnemy] = useState<Enemy | null>(null);

  const selectId = searchParams.get('select');
  React.useEffect(() => {
    if (selectId && db) {
      const enemy = db.enemiesMap.get(selectId);
      if (enemy) setSelectedEnemy(enemy);
    }
  }, [selectId, db]);

  const filteredEnemies = useMemo(() => {
    if (!db) return [];
    return db.enemies.filter((enemy) => {
      if (categoryFilter !== 'all' && enemy.category !== categoryFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = enemy.name.toLowerCase().includes(q);
        const matchVn = enemy.vietnameseName?.toLowerCase().includes(q);
        const matchId = enemy.id.toLowerCase().includes(q);
        if (!matchName && !matchVn && !matchId) return false;
      }
      return true;
    });
  }, [db, categoryFilter, search]);

  const handleSelectEnemy = (enemy: Enemy) => {
    setSelectedEnemy(enemy);
    setSearchParams({ select: enemy.id });
  };

  const handleCloseModal = () => {
    setSelectedEnemy(null);
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Skull className="w-6 h-6 text-red-500" />
            Xác sống & Quái vật (Enemies)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Dữ liệu sinh tồn về lượng máu HP, đòn đánh, kỹ năng đặc biệt và cách khắc chế kẻ địch.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-charcoal-900 border border-charcoal-800 px-3 py-1.5 rounded-lg w-fit">
          Tổng số: <span className="text-red-400 font-bold">{filteredEnemies.length}</span> mục tiêu
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm tên quái vật (Roamer, Frenzied, Blind One...)"
          className="flex-1"
        />
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
          {['all', 'zombie', 'boss'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-charcoal-900 text-slate-400 hover:text-slate-200 border border-charcoal-800'
              }`}
            >
              {cat === 'all' ? 'Tất cả' : cat === 'zombie' ? 'Zombie thường' : 'Trùm (Boss)'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEnemies.map((enemy) => {
          const favorite = isFavorite('enemy', enemy.id);
          const isBoss = enemy.category === 'boss';

          return (
            <Card
              key={enemy.id}
              hoverable
              onClick={() => handleSelectEnemy(enemy)}
              highlight={isBoss ? 'hazard' : 'none'}
              className="flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-200 group-hover:text-red-400 transition-colors text-base truncate">
                      {enemy.name}
                    </h3>
                    {enemy.vietnameseName && (
                      <p className="text-xs text-slate-400 truncate">{enemy.vietnameseName}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite('enemy', enemy.id);
                    }}
                    className={`p-1.5 rounded hover:bg-charcoal-800 transition-colors shrink-0 ${
                      favorite ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={isBoss ? 'red' : 'charcoal'} size="sm">
                    {isBoss ? 'BOSS NGUY HIỂM' : 'ZOMBIE'}
                  </Badge>
                  <span className="text-[11px] font-mono text-slate-400">
                    Nguy hiểm: {'💀'.repeat(enemy.dangerRating || 1)}
                  </span>
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-3 gap-2 bg-charcoal-950 p-2.5 rounded border border-charcoal-800 font-mono text-xs mb-3">
                  <div>
                    <span className="text-slate-500 block text-[10px]">LƯỢNG MÁU</span>
                    <span className="text-red-400 font-bold text-sm">{enemy.hp} HP</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">SÁT THƯƠNG</span>
                    <span className="text-amber-400 font-bold text-sm">{enemy.damage}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">GIÁP</span>
                    <span className="text-slate-300 font-bold text-sm">
                      {enemy.armor > 0 ? enemy.armor : '0'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{enemy.description}</p>
              </div>

              {/* Card Bottom CTA */}
              <div className="flex items-center justify-between pt-3 border-t border-charcoal-800 text-xs">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-amber-400 hover:text-amber-300 -ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/combat?enemy=${enemy.id}`);
                  }}
                >
                  <Calculator className="w-3.5 h-3.5 mr-1" />
                  Tính số đòn hạ gục
                </Button>
                <span className="flex items-center text-slate-500 group-hover:text-slate-300 text-xs">
                  Xem chi tiết <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Enemy Detail Modal */}
      {selectedEnemy && (
        <Modal
          isOpen={!!selectedEnemy}
          onClose={handleCloseModal}
          title={
            <div className="flex items-center gap-2">
              <Skull className="w-5 h-5 text-red-500" />
              <span className="font-bold text-slate-100">{selectedEnemy.name}</span>
              {selectedEnemy.vietnameseName && (
                <span className="text-xs text-slate-400 font-normal">
                  ({selectedEnemy.vietnameseName})
                </span>
              )}
            </div>
          }
          maxWidth="xl"
        >
          <div className="space-y-5">
            {/* Badges & Meta */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={selectedEnemy.category === 'boss' ? 'red' : 'charcoal'}>
                {selectedEnemy.category === 'boss' ? 'Trùm cấp cao (Boss)' : 'Zombie'}
              </Badge>
              <Badge variant="olive">
                {selectedEnemy.verificationStatus === 'verified' ? 'Đã xác minh' : 'Chưa xác minh'}
              </Badge>
              <span className="text-xs font-mono text-slate-400">
                Độ nguy hiểm: {'💀'.repeat(selectedEnemy.dangerRating)}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-300 bg-charcoal-950 p-3 rounded-lg border border-charcoal-800 leading-relaxed">
              {selectedEnemy.description}
            </p>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-sm">
              <div className="bg-charcoal-950 p-2.5 rounded border border-charcoal-800">
                <span className="text-xs text-slate-500 block">Lượng máu (HP)</span>
                <span className="text-xl font-bold text-red-400">{selectedEnemy.hp}</span>
              </div>
              <div className="bg-charcoal-950 p-2.5 rounded border border-charcoal-800">
                <span className="text-xs text-slate-500 block">Sát thương đòn</span>
                <span className="text-xl font-bold text-amber-400">{selectedEnemy.damage}</span>
              </div>
              <div className="bg-charcoal-950 p-2.5 rounded border border-charcoal-800">
                <span className="text-xs text-slate-500 block">Chỉ số giáp</span>
                <span className="text-xl font-bold text-slate-200">{selectedEnemy.armor}</span>
              </div>
              <div className="bg-charcoal-950 p-2.5 rounded border border-charcoal-800">
                <span className="text-xs text-slate-500 block">Tốc độ di chuyển</span>
                <span className="text-base font-bold text-slate-200 capitalize">
                  {selectedEnemy.movementSpeed || 'Bình thường'}
                </span>
              </div>
            </div>

            {/* Abilities */}
            {selectedEnemy.abilities && selectedEnemy.abilities.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> KỸ NĂNG NGUY HIỂM
                </h4>
                <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-3 space-y-1">
                  {selectedEnemy.abilities.map((ability, idx) => (
                    <p key={idx} className="text-xs text-red-200 font-mono">
                      • {ability}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Tactical Combat Tips */}
            {selectedEnemy.combatTips && selectedEnemy.combatTips.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-mono uppercase tracking-wider text-amber-500 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> MẸO CHIẾN ĐẤU & KHẮC CHẾ
                </h4>
                <div className="bg-charcoal-950 border border-charcoal-800 rounded-lg p-3 space-y-1.5">
                  {selectedEnemy.combatTips.map((tip, idx) => (
                    <p key={idx} className="text-xs text-slate-300 leading-relaxed">
                      💡 {tip}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Locations Spawning */}
            {selectedEnemy.locations && selectedEnemy.locations.length > 0 && db && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#a3b18a]" /> ĐỊA ĐIỂM XUẤT HIỆN
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEnemy.locations.map((locId) => {
                    const loc = db.locationsMap.get(locId);
                    return (
                      <span
                        key={locId}
                        onClick={() => {
                          handleCloseModal();
                          navigate(`/wiki/locations?select=${locId}`);
                        }}
                        className="px-2.5 py-1 rounded bg-charcoal-950 border border-charcoal-800 text-xs text-slate-300 hover:text-amber-400 hover:border-amber-500/50 cursor-pointer transition-colors"
                      >
                        {loc?.name || locId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Drops */}
            {selectedEnemy.drops && selectedEnemy.drops.length > 0 && db && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  VẬT PHẨM RƠI RA (DROPS)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEnemy.drops.map((drop, idx) => {
                    const item = db.itemsMap.get(drop.itemId);
                    return (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded bg-charcoal-950 border border-charcoal-800 text-xs font-mono text-slate-300"
                      >
                        {item?.name || drop.itemId}{' '}
                        {drop.chance && <span className="text-amber-400">({drop.chance})</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-charcoal-800">
              <Button
                variant="primary"
                icon={<Calculator className="w-4 h-4" />}
                onClick={() => {
                  handleCloseModal();
                  navigate(`/combat?enemy=${selectedEnemy.id}`);
                }}
              >
                Mở Combat Calculator với mục tiêu này
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
