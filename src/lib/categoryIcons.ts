import {
  Armchair,
  Cog,
  Crosshair,
  FlaskConical,
  Footprints,
  HardHat,
  HeartPulse,
  Package,
  Shield,
  Shirt,
  Sparkles,
  Sword,
  Utensils,
  Wrench,
  Hammer,
  type LucideIcon,
} from 'lucide-react';
import { ItemCategory } from '../types';

/** Stand-in artwork for items that have no screenshot yet, so the grid does not fill with blank squares. */
export const ITEM_CATEGORY_ICON: Record<ItemCategory, LucideIcon> = {
  weapon_melee: Sword,
  weapon_firearm: Crosshair,
  armor_head: HardHat,
  armor_chest: Shield,
  armor_legs: Shirt,
  armor_feet: Footprints,
  resource_raw: Package,
  resource_processed: FlaskConical,
  medical: HeartPulse,
  food: Utensils,
  tool: Wrench,
  workstation: Hammer,
  furniture: Armchair,
  component: Cog,
  special: Sparkles,
};
