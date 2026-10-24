import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGameData } from '../../context/DataContext';
import { Location } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/common/Modal';
import {
  MapPin,
  Zap,
  Clock,
  Skull,
  Package,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const LocationsPage: React.FC = () => {
  const { db } = useGameData();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const selectId = searchParams.get('select');
  React.useEffect(() => {
    if (selectId && db) {
      const loc = db.locationsMap.get(selectId);
      if (loc) setSelectedLocation(loc);
    }
  }, [selectId, db]);

  const filteredLocations = useMemo(() => {
    if (!db) return [];
    return db.locations.filter((loc) => {
      if (difficultyFilter !== 'all' && loc.difficulty !== difficultyFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = loc.name.toLowerCase().includes(q);
        const matchVn = loc.vietnameseName?.toLowerCase().includes(q);
        const matchId = loc.id.toLowerCase().includes(q);
        if (!matchName && !matchVn && !matchId) return false;
      }
      return true;
    });
  }, [db, difficultyFilter, search]);

  const handleSelectLocation = (loc: Location) => {
    setSelectedLocation(loc);
    setSearchParams({ select: loc.id });
  };

  const handleCloseModal = () => {
    setSelectedLocation(null);
    setSearchParams({});
  };

  const getDifficultyBadge = (diff: Location['difficulty']) => {
    switch (diff) {
      case 'easy':
        return <Badge variant="olive">Xanh lá (Dễ)</Badge>;
      case 'medium':
        return <Badge variant="amber">Vàng (Trung bình)</Badge>;
      case 'hard':
        return <Badge variant="red">Đỏ (Nguy hiểm)</Badge>;
      case 'bunker':
        return <Badge variant="blue">Hầm ngầm Bunker</Badge>;
      default:
        return <Badge variant="charcoal">{diff}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#a3b18a]" />
            Địa điểm sinh tồn (Locations)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Bản đồ các khu rừng, mỏ đá, hầm ngầm quân sự, boss và tài nguyên thu thập.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-charcoal-900 border border-charcoal-800 px-3 py-1.5 rounded-lg w-fit">
          Tổng số: <span className="text-[#a3b18a] font-bold">{filteredLocations.length}</span> địa điểm
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm địa điểm (Pine Bushes, Bunker Alfa, Farm...)"
          className="flex-1"
        />
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
          {['all', 'easy', 'medium', 'hard', 'bunker'].map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                difficultyFilter === diff
                  ? 'bg-[#656d4a] text-slate-100 font-bold'
                  : 'bg-charcoal-900 text-slate-400 hover:text-slate-200 border border-charcoal-800'
              }`}
            >
              {diff === 'all'
                ? 'Tất cả'
                : diff === 'easy'
                ? 'Vùng xanh'
                : diff === 'medium'
                ? 'Vùng vàng'
                : diff === 'hard'
                ? 'Vùng đỏ'
                : 'Bunker'}
            </button>
          ))}
        </div>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.map((loc) => {
          return (
            <Card
              key={loc.id}
              hoverable
              onClick={() => handleSelectLocation(loc)}
              className="flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-slate-200 group-hover:text-amber-400 transition-colors text-base truncate">
                      {loc.name}
                    </h3>
                    {loc.vietnameseName && (
                      <p className="text-xs text-slate-400 truncate">{loc.vietnameseName}</p>
                    )}
                  </div>
                  {getDifficultyBadge(loc.difficulty)}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mb-3">
                  <span>Nguy hiểm: {'💀'.repeat(loc.dangerLevel || 1)}</span>
                  {loc.energyCost && (
                    <span className="flex items-center gap-1 ml-auto text-amber-500">
                      <Zap className="w-3.5 h-3.5" /> {loc.energyCost} Năng lượng
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4">{loc.description}</p>

                {/* Enemies & Resources Snapshot */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Skull className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="text-slate-400 font-mono text-[11px]">
                      {loc.enemies.length} loại quái
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-slate-400 font-mono text-[11px]">
                      {loc.resources.length + loc.loot.length} tài nguyên & rương loot
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Bottom CTA */}
              <div className="flex items-center justify-between pt-3 border-t border-charcoal-800 text-xs">
                {loc.requiresChopper && (
                  <span className="text-[11px] font-mono text-amber-500 font-medium">
                    🏍️ Cần Chopper
                  </span>
                )}
                <span className="flex items-center text-slate-500 group-hover:text-slate-200 ml-auto">
                  Xem chi tiết <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Location Detail Modal */}
      {selectedLocation && (
        <Modal
          isOpen={!!selectedLocation}
          onClose={handleCloseModal}
          title={
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#a3b18a]" />
              <span className="font-bold text-slate-100">{selectedLocation.name}</span>
              {selectedLocation.vietnameseName && (
                <span className="text-xs font-normal text-slate-400">
                  ({selectedLocation.vietnameseName})
                </span>
              )}
            </div>
          }
          maxWidth="xl"
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {getDifficultyBadge(selectedLocation.difficulty)}
              <span className="text-xs font-mono text-slate-400">
                Độ nguy hiểm: {'💀'.repeat(selectedLocation.dangerLevel)}
              </span>
              {selectedLocation.energyCost && (
                <span className="text-xs font-mono text-amber-500 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> {selectedLocation.energyCost} Năng lượng
                </span>
              )}
              {selectedLocation.resetTimeHours && (
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Làm mới sau {selectedLocation.resetTimeHours}h
                </span>
              )}
            </div>

            <p className="text-sm text-slate-300 bg-charcoal-950 p-3 rounded-lg border border-charcoal-800 leading-relaxed">
              {selectedLocation.description}
            </p>

            {/* Tactical Notes */}
            {selectedLocation.notes && (
              <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-3 text-xs text-amber-300 leading-relaxed">
                <span className="font-bold block mb-1">⚠️ LƯU Ý TÁC CHIẾN:</span>
                {selectedLocation.notes}
              </div>
            )}

            {/* Enemies in Location */}
            {db && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1.5">
                  <Skull className="w-4 h-4" /> XÁC SỐNG XUẤT HIỆN
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedLocation.enemies.map((enemyId) => {
                    const enemy = db.enemiesMap.get(enemyId);
                    return (
                      <div
                        key={enemyId}
                        onClick={() => {
                          handleCloseModal();
                          navigate(`/wiki/enemies?select=${enemyId}`);
                        }}
                        className="p-2.5 rounded bg-charcoal-950 border border-charcoal-800 flex items-center justify-between hover:border-red-500/50 cursor-pointer transition-colors"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-200">
                            {enemy?.name || enemyId}
                          </span>
                          {enemy && (
                            <span className="text-[11px] font-mono text-red-400 block">
                              HP: {enemy.hp} • Dmg: {enemy.damage}
                            </span>
                          )}
                        </div>
                        <Button size="sm" variant="ghost" className="text-xs text-slate-400">
                          Chi tiết
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Resources and Loot */}
            {db && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Package className="w-4 h-4" /> TÀI NGUYÊN & RƯƠNG LOOT
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[...selectedLocation.resources, ...selectedLocation.loot].map((itemId, idx) => {
                    const item = db.itemsMap.get(itemId);
                    return (
                      <span
                        key={idx}
                        onClick={() => {
                          handleCloseModal();
                          navigate(`/wiki/items?select=${itemId}`);
                        }}
                        className="px-2.5 py-1 rounded bg-charcoal-950 border border-charcoal-800 text-xs text-slate-300 hover:text-amber-400 hover:border-amber-500/40 cursor-pointer transition-colors"
                      >
                        {item?.name || itemId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
