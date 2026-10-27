import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Wrench } from 'lucide-react';
import { Item, LocationStructure } from '../../types';
import { Table, Tbody, Td, Th, Thead, Tr } from '../common/Table';
import { ItemCell } from './ItemCell';

/** Wiki view of a one-time structure: the items to hand in at each stage, and where to get them. */
export const StageList: React.FC<{ structure: LocationStructure; itemsMap: Map<string, Item> }> = ({
  structure,
  itemsMap,
}) => (
  <div className="space-y-4 pt-2">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Layers className="h-4 w-4 text-accent" />
          Danh sách nguyên liệu cần bỏ vào
        </h3>
        <p className="mt-0.5 text-xs text-muted">Liệt kê theo từng giai đoạn hoàn thiện của công trình.</p>
      </div>
      <span className="num text-xs text-muted">{structure.stages.length} giai đoạn</span>
    </div>

    {structure.stages.map((stage, index) => {
      const title = structure.stages.length > 1 ? `Giai đoạn ${index + 1}: ${stage.name}` : stage.name;

      return (
        <div key={stage.id} className="overflow-hidden rounded-card border border-line">
          <div className="flex items-center justify-between border-b border-line bg-subtle/60 px-4 py-2.5">
            <span className="text-sm font-medium">{title}</span>
            <span className="num text-xs text-muted">{stage.requirements.reduce((sum, r) => sum + r.quantity, 0)} món</span>
          </div>

          <Table caption={title}>
            <Thead>
              <Th>Vật phẩm</Th>
              <Th align="right">Số lượng cần</Th>
              <Th>Cách kiếm / chế tạo</Th>
            </Thead>
            <Tbody>
              {stage.requirements.length === 0 ? (
                <Tr>
                  <Td align="center" colSpan={3} className="text-xs text-muted">
                    Không yêu cầu vật phẩm nộp vào (ví dụ: thao tác mở khóa hoặc nhập mã).
                  </Td>
                </Tr>
              ) : (
                stage.requirements.map((req) => {
                  const item = itemsMap.get(req.itemId);
                  return (
                    <Tr key={req.itemId}>
                      <Td>
                        <ItemCell itemId={req.itemId} item={item} />
                      </Td>
                      <Td align="right" numeric className="text-base font-bold text-fg">
                        {req.quantity}
                      </Td>
                      <Td className="text-xs text-muted">
                        {item?.craftable ? (
                          <Link
                            to={`/planner?item=${req.itemId}&qty=${req.quantity}`}
                            className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                          >
                            <Wrench className="h-3 w-3" />
                            <span>Chế tạo được (bấm xem công thức)</span>
                          </Link>
                        ) : (
                          <span>Nhặt trong rương game / sự kiện</span>
                        )}
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </div>
      );
    })}
  </div>
);
