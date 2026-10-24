import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameData } from '../../context/DataContext';
import { Recipe } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { SearchInput } from '../../components/common/SearchInput';
import { Hammer, Layers, Clock, ArrowRight, Wrench } from 'lucide-react';

export const RecipesPage: React.FC = () => {
  const { db } = useGameData();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [workstationFilter, setWorkstationFilter] = useState('all');

  const workstations = [
    { id: 'all', label: 'Tất cả' },
    { id: 'hand', label: 'Chế tạo tay' },
    { id: 'Woodworking Bench', label: 'Bàn xẻ gỗ' },
    { id: 'Furnace', label: 'Lò nung' },
    { id: 'Workbench', label: 'Bàn thợ nguội' },
    { id: 'Tanning Rack', label: 'Giá thuộc da' },
    { id: 'Loom', label: 'Khung dệt' },
  ];

  const filteredRecipes = useMemo(() => {
    if (!db) return [];
    return db.recipes.filter((r) => {
      // Workstation filter
      if (workstationFilter === 'hand' && r.workstation) return false;
      if (workstationFilter !== 'all' && workstationFilter !== 'hand' && r.workstation !== workstationFilter) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const outputItem = db.itemsMap.get(r.outputItemId);
        const matchName = outputItem?.name.toLowerCase().includes(q);
        const matchVn = outputItem?.vietnameseName?.toLowerCase().includes(q);
        const matchId = r.outputItemId.toLowerCase().includes(q);

        const matchIngredient = r.ingredients.some((ing) => {
          const ingItem = db.itemsMap.get(ing.itemId);
          return (
            ingItem?.name.toLowerCase().includes(q) ||
            ingItem?.vietnameseName?.toLowerCase().includes(q)
          );
        });

        if (!matchName && !matchVn && !matchId && !matchIngredient) return false;
      }

      return true;
    });
  }, [db, workstationFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Hammer className="w-6 h-6 text-blue-500" />
            Công thức chế tạo (Crafting Recipes)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Tra cứu nguyên liệu cần thiết, bàn chế tác và cấp độ yêu cầu cho từng trang bị.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-charcoal-900 border border-charcoal-800 px-3 py-1.5 rounded-lg w-fit">
          Tổng số: <span className="text-blue-400 font-bold">{filteredRecipes.length}</span> công thức
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm công thức chế tạo (Machete, Ván gỗ, Sắt, Đinh...)"
          className="flex-1"
        />
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
          {workstations.map((ws) => (
            <button
              key={ws.id}
              onClick={() => setWorkstationFilter(ws.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                workstationFilter === ws.id
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-charcoal-900 text-slate-400 hover:text-slate-200 border border-charcoal-800'
              }`}
            >
              {ws.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipes.map((recipe) => {
          const outputItem = db?.itemsMap.get(recipe.outputItemId);

          return (
            <Card key={recipe.id} className="flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors text-base">
                      {outputItem?.name || recipe.outputItemId}
                      {recipe.outputQuantity > 1 && (
                        <span className="text-amber-400 text-sm ml-1 font-mono">
                          x{recipe.outputQuantity}
                        </span>
                      )}
                    </h3>
                    {outputItem?.vietnameseName && (
                      <p className="text-xs text-slate-400">{outputItem.vietnameseName}</p>
                    )}
                  </div>
                  <Badge variant="blue" size="sm">
                    {recipe.workstation || 'Chế tạo tay'}
                  </Badge>
                </div>

                {/* Level & Time Requirements */}
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mb-4 bg-charcoal-950 p-2 rounded border border-charcoal-800">
                  <span>Cấp yêu cầu: <b className="text-slate-200">{recipe.levelRequired || 1}</b></span>
                  {recipe.craftTimeSeconds && (
                    <span className="flex items-center gap-1 ml-auto">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {recipe.craftTimeSeconds >= 60
                        ? `${Math.round(recipe.craftTimeSeconds / 60)} phút`
                        : `${recipe.craftTimeSeconds}s`}
                    </span>
                  )}
                </div>

                {/* Ingredients List */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
                    NGUYÊN LIỆU ĐÒI HỎI:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {recipe.ingredients.map((ing) => {
                      const ingItem = db?.itemsMap.get(ing.itemId);
                      return (
                        <div
                          key={ing.itemId}
                          className="flex items-center justify-between p-2 rounded bg-charcoal-950 border border-charcoal-800/80 text-xs"
                        >
                          <span className="text-slate-300 truncate mr-2" title={ingItem?.name || ing.itemId}>
                            {ingItem?.name || ing.itemId}
                          </span>
                          <span className="font-mono font-bold text-amber-400 shrink-0">
                            x{ing.quantity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom CTA Button */}
              <div className="pt-3 border-t border-charcoal-800 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Layers className="w-4 h-4" />}
                  onClick={() => navigate(`/planner?item=${recipe.outputItemId}`)}
                  className="w-full justify-center"
                >
                  Lên kế hoạch chế tạo này
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
