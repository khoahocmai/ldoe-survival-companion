import React from 'react';
import { Link } from 'react-router-dom';
import { Item } from '../../types';
import { ITEM_CATEGORY_LABEL } from '../../lib/labels';
import { EntityImage } from '../common/EntityImage';

/** Thumbnail, linked name and category: how an item is shown in the construction and chopper tables. */
export const ItemCell: React.FC<{ itemId: string; item?: Item }> = ({ itemId, item }) => {
  const name = item?.vietnameseName || item?.name || itemId;

  return (
    <div className="flex items-center gap-2.5">
      <div className="h-9 w-9 shrink-0 rounded-md border border-line bg-surface p-1">
        <EntityImage folder="items" id={itemId} alt={name} compact />
      </div>
      <div>
        <Link to={`/wiki/items?select=${itemId}`} className="block font-medium hover:text-accent hover:underline">
          {name}
        </Link>
        {item?.category && (
          <span className="text-2xs text-muted">
            {ITEM_CATEGORY_LABEL[item.category as keyof typeof ITEM_CATEGORY_LABEL] ?? item.category}
          </span>
        )}
      </div>
    </div>
  );
};
