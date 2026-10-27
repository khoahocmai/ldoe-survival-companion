import React, { useMemo, useState, useEffect } from 'react';
import { Plus, Trash2, RotateCcw, Sparkles, Minus } from 'lucide-react';
import { Recipe, RecipeIngredient } from '../../types';
import { useGameData } from '../../context/DataContext';
import { Modal } from '../common/Modal';
import { Button, IconButton } from '../common/Button';
import { Field, NumberInput, Select, TextInput } from '../common/Field';
import { FormRow } from '../common/FormModal';
import { Callout, Section } from '../common/Layout';
import { RECIPE_CATEGORY_LABEL } from '../../lib/labels';

interface RecipeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Partial<Recipe> | null;
  isNew?: boolean;
  onSave: (recipe: Recipe) => void | Promise<void>;
  onRevert?: (recipeId: string) => void | Promise<void>;
}

export const RecipeEditModal: React.FC<RecipeEditModalProps> = ({
  isOpen,
  onClose,
  recipe,
  isNew = false,
  onSave,
  onRevert,
}) => {
  const { db } = useGameData();
  const [formData, setFormData] = useState<Partial<Recipe> | null>(null);

  useEffect(() => {
    if (recipe) {
      setFormData({
        ...recipe,
        outputQuantity: recipe.outputQuantity || 1,
        ingredients: recipe.ingredients ? recipe.ingredients.map((ing) => ({ ...ing })) : [],
      });
    } else {
      setFormData(null);
    }
  }, [recipe]);

  const sortedItems = useMemo(
    () => [...(db?.items ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [db?.items]
  );

  const workstationOptions = useMemo(() => {
    const list = Array.from(
      new Set(
        (db?.recipes ?? [])
          .map((r) => r.workstation?.trim())
          .filter(Boolean) as string[]
      )
    ).sort();
    return list;
  }, [db?.recipes]);

  if (!isOpen || !formData || !db) return null;

  const patch = (changes: Partial<Recipe>) =>
    setFormData((prev) => (prev ? { ...prev, ...changes } : prev));

  const ingredients = formData.ingredients ?? [];

  const setIngredient = (index: number, changes: Partial<RecipeIngredient>) => {
    patch({
      ingredients: ingredients.map((ing, i) =>
        i === index ? { ...ing, ...changes } : ing
      ),
    });
  };

  const addIngredient = () => {
    const defaultId = sortedItems[0]?.id ?? '';
    patch({
      ingredients: [...ingredients, { itemId: defaultId, quantity: 1 }],
    });
  };

  const removeIngredient = (index: number) => {
    patch({
      ingredients: ingredients.filter((_, i) => i !== index),
    });
  };

  const canSave =
    Boolean(formData.outputItemId) &&
    ingredients.length > 0 &&
    ingredients.every((i) => i.itemId && i.quantity > 0);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSave || !formData.outputItemId) return;

    const finalEntity: Recipe = {
      ...formData,
      id: formData.id || `recipe_${formData.outputItemId}_${Date.now()}`,
      outputItemId: formData.outputItemId,
      outputQuantity: Math.max(1, formData.outputQuantity || 1),
      ingredients: ingredients.map((i) => ({
        itemId: i.itemId,
        quantity: Math.max(1, i.quantity),
      })),
      workstation: formData.workstation?.trim() || undefined,
      isCustom: true,
    } as Recipe;

    await onSave(finalEntity);
    onClose();
  };

  const handleRevert = async () => {
    if (formData.id && onRevert) {
      await onRevert(formData.id);
      onClose();
    }
  };

  const outputItem = db.itemsMap.get(formData.outputItemId || '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isNew
          ? 'Tạo công thức mới'
          : `Sửa công thức: ${outputItem?.name || formData.outputItemId || ''}`
      }
      maxWidth="lg"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <div>
            {!isNew && formData.isCustom && onRevert && (
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw />}
                onClick={handleRevert}
                className="text-amber-500 hover:text-amber-600"
              >
                Khôi phục gốc
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              Lưu thay đổi
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        <Callout tone="accent" icon={<Sparkles />}>
          <div className="text-xs leading-relaxed">
            <strong>Tùy biến nguyên liệu linh hoạt:</strong> Bạn có thể dễ dàng điều chỉnh số lượng
            nguyên liệu (ví dụ: từ 3 Gỗ sồi $\rightarrow$ 2 Gỗ sồi để ra 1 Ván sồi). Dữ liệu được
            lưu vào bộ nhớ trình duyệt và áp dụng trực tiếp vào mọi tính toán trong Kế hoạch chế tạo.
          </div>
        </Callout>

        <FormRow cols={2}>
          <Field label="Thành phẩm đầu ra">
            <Select
              value={formData.outputItemId ?? ''}
              onChange={(e) => patch({ outputItemId: e.target.value })}
              disabled={!isNew}
            >
              {sortedItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} {i.vietnameseName ? `(${i.vietnameseName})` : ''}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Số lượng thành phẩm tạo ra">
            <div className="flex items-center gap-1.5">
              <IconButton
                label="Giảm số lượng"
                className="border border-line"
                disabled={(formData.outputQuantity || 1) <= 1}
                onClick={() =>
                  patch({
                    outputQuantity: Math.max(1, (formData.outputQuantity || 1) - 1),
                  })
                }
              >
                <Minus />
              </IconButton>
              <NumberInput
                min={1}
                max={999}
                value={formData.outputQuantity || 1}
                onValueChange={(v) => patch({ outputQuantity: Math.max(1, v) })}
                className="w-20 text-center font-semibold"
              />
              <IconButton
                label="Tăng số lượng"
                className="border border-line"
                onClick={() =>
                  patch({
                    outputQuantity: (formData.outputQuantity || 1) + 1,
                  })
                }
              >
                <Plus />
              </IconButton>
            </div>
          </Field>
        </FormRow>

        <FormRow cols={3}>
          <Field label="Bàn chế tác" hint="Để trống nếu chế tạo tay">
            <TextInput
              list="workstation-options-list"
              value={formData.workstation ?? ''}
              placeholder="VD: Woodworking Bench..."
              onChange={(e) => patch({ workstation: e.target.value })}
            />
            <datalist id="workstation-options-list">
              {workstationOptions.map((ws) => (
                <option key={ws} value={ws} />
              ))}
            </datalist>
          </Field>

          <Field label="Thời gian gia công (giây)">
            <NumberInput
              value={formData.craftTimeSeconds}
              onValueChange={(v) => patch({ craftTimeSeconds: v || undefined })}
              placeholder="VD: 240"
            />
          </Field>

          <Field label="Phân loại">
            <Select
              value={formData.category ?? 'crafting'}
              onChange={(e) =>
                patch({ category: e.target.value as Recipe['category'] })
              }
            >
              {Object.entries(RECIPE_CATEGORY_LABEL).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </FormRow>

        <Section
          title={`Nguyên liệu cần (${ingredients.length})`}
          description="Thiết lập danh sách vật liệu và số lượng yêu cầu để chế tạo 1 lượt."
          action={
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus />}
              onClick={addIngredient}
            >
              Thêm nguyên liệu
            </Button>
          }
        >
          <div className="space-y-2.5 rounded-xl border border-line bg-surface/50 p-3">
            {ingredients.map((ing, index) => {
              const ingItem = db.itemsMap.get(ing.itemId);
              return (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-line/60 bg-subtle/30 p-2 sm:flex-nowrap"
                >
                  <div className="min-w-0 flex-1">
                    <Select
                      aria-label="Vật phẩm nguyên liệu"
                      value={ing.itemId}
                      onChange={(e) =>
                        setIngredient(index, { itemId: e.target.value })
                      }
                      className="w-full text-sm"
                    >
                      {sortedItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} {item.vietnameseName ? `(${item.vietnameseName})` : ''}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-xs font-medium text-muted">Cần:</span>
                    <IconButton
                      label="Giảm số lượng"
                      className="border border-line"
                      disabled={ing.quantity <= 1}
                      onClick={() =>
                        setIngredient(index, {
                          quantity: Math.max(1, ing.quantity - 1),
                        })
                      }
                    >
                      <Minus />
                    </IconButton>
                    <NumberInput
                      aria-label="Số lượng yêu cầu"
                      min={1}
                      max={9999}
                      value={ing.quantity}
                      onValueChange={(v) =>
                        setIngredient(index, { quantity: Math.max(1, v) })
                      }
                      className="w-16 text-center font-semibold text-accent"
                    />
                    <IconButton
                      label="Tăng số lượng"
                      className="border border-line"
                      onClick={() =>
                        setIngredient(index, {
                          quantity: ing.quantity + 1,
                        })
                      }
                    >
                      <Plus />
                    </IconButton>
                  </div>

                  <IconButton
                    label="Xóa nguyên liệu"
                    disabled={ingredients.length <= 1}
                    onClick={() => removeIngredient(index)}
                    className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Trash2 />
                  </IconButton>
                </div>
              );
            })}
          </div>
        </Section>
      </form>
    </Modal>
  );
};
