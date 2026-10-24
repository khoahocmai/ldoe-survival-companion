import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGameData } from '../context/DataContext';
import { usePersonalData } from '../hooks/usePersonalData';
import { planCrafting, CraftingTreeNode } from '../lib/calculators/craftingPlanner';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Target,
  Package,
  ChevronRight,
  ChevronDown,
  Hammer,
  RotateCcw,
  ListTodo,
} from 'lucide-react';

export const CraftingPlanner: React.FC = () => {
  const { db } = useGameData();
  const { inventory, addGoal } = usePersonalData();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Selected item & quantity
  const [targetItemId, setTargetItemId] = useState<string>('spiked_devastator');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'materials' | 'steps' | 'tree' | 'checklist'>('materials');
  const [checklistCompleted, setChecklistCompleted] = useState<Record<string, boolean>>({});
  const [goalCreatedNotice, setGoalCreatedNotice] = useState<string | null>(null);

  // Sync with URL params
  useEffect(() => {
    const itemParam = searchParams.get('item');
    const qtyParam = searchParams.get('qty');
    if (itemParam && db?.itemsMap.has(itemParam)) {
      setTargetItemId(itemParam);
    }
    if (qtyParam && !isNaN(Number(qtyParam))) {
      setQuantity(Math.max(1, Number(qtyParam)));
    }
  }, [searchParams, db]);

  // Craftable items list for dropdown
  const craftableItems = useMemo(() => {
    if (!db) return [];
    return db.items.filter((item) => db.recipesByOutputMap.has(item.id));
  }, [db]);

  // Run pure crafting planner engine
  const plan = useMemo(() => {
    if (!db) return null;
    return planCrafting({
      targetItemId,
      quantity,
      inventory,
      recipesByOutput: db.recipesByOutputMap,
      itemsMap: db.itemsMap,
    });
  }, [db, targetItemId, quantity, inventory]);

  const handleCreateGoal = () => {
    if (!plan || !plan.targetItem) return;
    const goalTitle = `Chế tạo ${quantity}x ${plan.targetItem.name}`;
    addGoal(goalTitle, targetItemId, quantity, 'Tạo từ Công cụ Lên kế hoạch chế tạo (Crafting Planner)');
    setGoalCreatedNotice(`Đã thêm mục tiêu "${goalTitle}" vào danh sách Mục tiêu cá nhân!`);
    setTimeout(() => setGoalCreatedNotice(null), 4000);
  };

  const handleToggleChecklist = (id: string) => {
    setChecklistCompleted((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Render tree node recursively
  const renderTreeNode = (node: CraftingTreeNode, depth = 0) => {
    return (
      <div key={`${node.itemId}_${depth}`} className="ml-4 border-l border-charcoal-750 pl-3 my-2">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="font-semibold text-slate-200">{node.itemName}</span>
          <span className="text-amber-400 font-bold">x{node.quantityRequired}</span>
          {node.usedFromInventory > 0 && (
            <span className="text-emerald-400 text-[11px] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
              Có sẵn: {node.usedFromInventory}
            </span>
          )}
          {node.craftsNeeded > 0 && (
            <span className="text-blue-400 text-[11px]">
              (Cần chế tạo {node.craftsNeeded} lần • {node.recipe?.workstation || 'Chế tạo tay'})
            </span>
          )}
        </div>
        {node.children.length > 0 && (
          <div className="mt-1">
            {node.children.map((child, idx) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-500" />
            Kế hoạch chế tạo (Crafting Planner)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Tính toán nguyên liệu phân rã đệ quy (nested recipes), tự động đối chiếu kho đồ và tạo checklist.
          </p>
        </div>
        {plan && (
          <Button
            variant="primary"
            icon={<Target className="w-4 h-4" />}
            onClick={handleCreateGoal}
          >
            Tạo mục tiêu cá nhân
          </Button>
        )}
      </div>

      {goalCreatedNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600/60 rounded-lg text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{goalCreatedNotice}</span>
        </div>
      )}

      {/* Target Item Controls */}
      <Card highlight="amber">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8">
            <label className="text-xs font-mono uppercase tracking-wider text-amber-500 font-semibold block mb-1.5">
              CHỌN VẬT PHẨM MỤC TIÊU CẦN CHẾ TẠO:
            </label>
            <select
              value={targetItemId}
              onChange={(e) => {
                setTargetItemId(e.target.value);
                setSearchParams({ item: e.target.value, qty: String(quantity) });
              }}
              className="w-full bg-charcoal-950 border border-charcoal-750 focus:border-amber-500 rounded-md px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none"
            >
              {craftableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.vietnameseName ? `(${item.vietnameseName})` : ''} — {item.category}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
              SỐ LƯỢNG CẦN CHẾ TẠO:
            </label>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <input
                type="number"
                min="1"
                max="999"
                value={quantity}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value) || 1);
                  setQuantity(val);
                  setSearchParams({ item: targetItemId, qty: String(val) });
                }}
                className="w-20 text-center bg-charcoal-950 border border-charcoal-750 rounded px-2 py-1.5 text-sm font-mono font-bold text-amber-400 focus:outline-none"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => setQuantity(5)}
                  className="px-2 py-1 text-xs bg-charcoal-800 hover:bg-charcoal-750 rounded text-slate-300"
                >
                  5
                </button>
                <button
                  onClick={() => setQuantity(10)}
                  className="px-2 py-1 text-xs bg-charcoal-800 hover:bg-charcoal-750 rounded text-slate-300"
                >
                  10
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Plan Details & Tabs */}
      {plan && (
        <div className="space-y-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-charcoal-800 pb-2">
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'materials'
                  ? 'bg-amber-600 text-charcoal-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tổng nguyên liệu cần farm ({plan.totalRawMaterials.length})
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'steps'
                  ? 'bg-amber-600 text-charcoal-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Các bước chế biến ({plan.intermediateSteps.length})
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'checklist'
                  ? 'bg-amber-600 text-charcoal-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Checklist gom đồ
            </button>
            <button
              onClick={() => setActiveTab('tree')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'tree'
                  ? 'bg-amber-600 text-charcoal-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cây phân rã đệ quy (Tree)
            </button>
          </div>

          {/* Tab 1: Total Raw Materials & Inventory Match */}
          {activeTab === 'materials' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-wider text-slate-200 font-bold">
                    ĐỐI CHIẾU NGUYÊN LIỆU VỚI KHO ĐỒ
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hệ thống tự động khấu trừ vật phẩm đang có sẵn và chỉ tính số lượng còn thiếu.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-charcoal-800 text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Nguyên liệu</th>
                      <th className="py-2.5 px-3">Tổng cần</th>
                      <th className="py-2.5 px-3">Có trong kho</th>
                      <th className="py-2.5 px-3">Còn thiếu</th>
                      <th className="py-2.5 px-3 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal-800/60">
                    {plan.totalRawMaterials.map((mat) => (
                      <tr key={mat.itemId} className="hover:bg-charcoal-800/40">
                        <td className="py-3 px-3 font-semibold text-slate-200">{mat.itemName}</td>
                        <td className="py-3 px-3 font-bold text-slate-300">{mat.required}</td>
                        <td className="py-3 px-3 font-bold text-slate-400">{mat.inInventory}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-bold ${
                              mat.missing > 0 ? 'text-red-400' : 'text-emerald-400'
                            }`}
                          >
                            {mat.missing > 0 ? mat.missing : 'Đủ'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {mat.isSatisfied ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đã sẵn sàng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                              <AlertCircle className="w-3.5 h-3.5" /> Cần farm thêm
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Tab 2: Intermediate Craft Steps */}
          {activeTab === 'steps' && (
            <div className="space-y-3">
              {plan.intermediateSteps.map((step, idx) => (
                <Card key={step.itemId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-950 text-blue-400 border border-blue-700/60 flex items-center justify-center font-mono text-xs font-bold">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-slate-200 text-sm">
                        Chế tạo {step.itemName} (x{step.totalOutputQuantity})
                      </h4>
                      <Badge variant="blue" size="sm">
                        {step.workstation || 'Chế tạo tay'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 font-mono pl-7">
                      Thực hiện: <b>{step.craftCount}</b> lượt chế tạo
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end pl-7 sm:pl-0">
                    {step.ingredients.map((ing) => (
                      <span
                        key={ing.itemId}
                        className="px-2 py-1 rounded bg-charcoal-950 border border-charcoal-800 text-xs font-mono text-slate-300"
                      >
                        {ing.itemName}: <b className="text-amber-400">{ing.quantity * step.craftCount}</b>
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Tab 3: Interactive Checklist */}
          {activeTab === 'checklist' && (
            <Card>
              <h3 className="text-sm font-mono uppercase tracking-wider text-slate-200 font-bold mb-3 flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-amber-500" /> CHECKLIST NGUYÊN LIỆU ĐI FARM
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Đánh dấu các nguyên liệu bạn đã thu thập được trong balo khi đi rừng.
              </p>
              <div className="space-y-2">
                {plan.totalRawMaterials.map((mat) => {
                  const isDone = checklistCompleted[mat.itemId] || mat.isSatisfied;
                  return (
                    <label
                      key={mat.itemId}
                      onClick={() => handleToggleChecklist(mat.itemId)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors select-none ${
                        isDone
                          ? 'bg-charcoal-950/40 border-charcoal-800/40 opacity-70'
                          : 'bg-charcoal-950 border-charcoal-800 hover:border-charcoal-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => {}}
                          className="rounded border-charcoal-700 text-amber-600 focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                        <span
                          className={`text-sm font-medium ${
                            isDone ? 'line-through text-slate-500' : 'text-slate-200'
                          }`}
                        >
                          {mat.itemName}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-amber-400 font-bold">
                        Cần {mat.required} (Thiếu: {mat.missing})
                      </span>
                    </label>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Tab 4: Recursive Tree */}
          {activeTab === 'tree' && (
            <Card>
              <h3 className="text-sm font-mono uppercase tracking-wider text-slate-200 font-bold mb-2">
                CẤU TRÚC PHÂN TÁCH NGUYÊN LIỆU (CRAFTING TREE)
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Hiển thị từng tầng công thức từ thành phẩm đến vật liệu thô.
              </p>
              <div className="bg-charcoal-950 p-4 rounded-lg border border-charcoal-800 overflow-x-auto">
                {plan.tree && renderTreeNode(plan.tree)}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
