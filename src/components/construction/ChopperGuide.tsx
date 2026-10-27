import React from 'react';
import { Award, Bike } from 'lucide-react';
import { Item, StructureCycleItem, StructureCyclePerk } from '../../types';
import { Badge, Tone } from '../common/Badge';
import { Table, Tbody, Td, Th, Thead, Tr } from '../common/Table';
import { ItemCell } from './ItemCell';

/** Shown when the structure data carries no perk guide of its own. */
export const DEFAULT_PERK_GUIDE: StructureCyclePerk[] = [
  {
    name: 'Trunk Capacity (Mở rộng cốp xe)',
    tier: 'S',
    description: 'Mở rộng thêm số ô chứa đồ trong cốp xe máy (tối đa 8 ô). Đây là ưu tiên số 1 tuyệt đối!',
  },
  {
    name: 'Fuel Economy (Tiết kiệm xăng)',
    tier: 'A',
    description: 'Giảm lượng xăng tiêu thụ khi di chuyển trên bản đồ thế giới, giúp tiết kiệm tài nguyên xăng đáng kể.',
  },
  {
    name: 'Fuel Tank (Dung tích bình xăng)',
    tier: 'B',
    description: 'Tăng lượng xăng tối đa có thể chứa trong bình xe máy, tiện lợi cho các hành trình dài ngày.',
  },
  {
    name: 'Impact Power (Sát thương đâm tông)',
    tier: 'C',
    description: 'Tăng sát thương khi lái xe húc vào zombie (ít khi dùng vì vừa hao xăng vừa hỏng xe).',
  },
];

const PERK_TONE: Record<StructureCyclePerk['tier'], Tone> = { S: 'accent', A: 'ok', B: 'info', C: 'neutral' };

const TIER_LABEL: Record<StructureCycleItem['tier'], { tone: Tone; label: string }> = {
  recommended: { tone: 'ok', label: 'Khuyên dùng' },
  caution: { tone: 'warn', label: 'Cân nhắc' },
  avoid: { tone: 'neutral', label: 'Giữ lại chế đồ' },
};

interface ChopperGuideProps {
  acceptedItems: StructureCycleItem[];
  perkGuide: StructureCyclePerk[];
  itemsMap: Map<string, Item>;
}

/** Wiki view of the recurring Chopper workshop: what Jane accepts, and which perks to pick. */
export const ChopperGuide: React.FC<ChopperGuideProps> = ({ acceptedItems, perkGuide, itemsMap }) => (
  <div className="space-y-5 pt-2">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Bike className="h-4 w-4 text-accent" />
          Danh sách nguyên liệu Jane nhận nộp lấy EXP
        </h3>
        <p className="mt-0.5 text-xs text-muted">Bảng quy đổi điểm EXP mỗi đơn vị và mức hạn ngạch mỗi ngày.</p>
      </div>
      <Badge tone="info">Reset mỗi 24h</Badge>
    </div>

    <div className="overflow-hidden rounded-card border border-line">
      <Table caption="Vật phẩm nộp cho Jane">
        <Thead>
          <Th>Vật phẩm</Th>
          <Th align="right">EXP / món</Th>
          <Th align="center">Hạn mức / ngày</Th>
          <Th>Gợi ý</Th>
          <Th>Lý do & lưu ý</Th>
        </Thead>
        <Tbody>
          {acceptedItems.map((item) => {
            const tier = TIER_LABEL[item.tier];
            return (
              <Tr key={item.itemId}>
                <Td>
                  <ItemCell itemId={item.itemId} item={itemsMap.get(item.itemId)} />
                </Td>
                <Td align="right" numeric className="font-bold text-accent">
                  +{item.valuePerItem} EXP
                </Td>
                <Td align="center" className="text-xs text-muted">
                  {item.dailyLimit ? item.dailyLimit : 'Không giới hạn'}
                </Td>
                <Td>
                  <Badge tone={tier.tone}>{tier.label}</Badge>
                </Td>
                <Td className="text-xs leading-relaxed text-muted">{item.reason}</Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </div>

    <div className="space-y-3 rounded-card border border-line bg-subtle/30 p-4">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Award className="h-4 w-4 text-accent" />
          Thứ tự ưu tiên kỹ năng Chopper (Perk Guide)
        </h4>
        <Badge tone="neutral">Tham khảo</Badge>
      </div>
      <p className="text-xs text-muted">Mỗi khi lên cấp, bạn nhận được lượt quay ngẫu nhiên 3 kỹ năng để chọn 1.</p>

      <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-2">
        {perkGuide.map((perk) => (
          <div key={perk.name} className="rounded-control border border-line bg-surface p-2.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold">{perk.name}</span>
              <Badge tone={PERK_TONE[perk.tier]}>Hạng {perk.tier}</Badge>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">{perk.description}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);
