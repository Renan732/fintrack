import {
  Briefcase,
  Car,
  CreditCard,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  PiggyBank,
  Plane,
  Shield,
  ShoppingBag,
  Tag,
  TrendingUp,
  Utensils,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  laptop: Laptop,
  'trending-up': TrendingUp,
  utensils: Utensils,
  home: Home,
  car: Car,
  'gamepad-2': Gamepad2,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'shopping-bag': ShoppingBag,
  zap: Zap,
  'credit-card': CreditCard,
  gift: Gift,
  plane: Plane,
  'piggy-bank': PiggyBank,
  shield: Shield,
  tag: Tag,
};

export const CATEGORY_ICON_OPTIONS = [
  { key: 'tag', label: 'Geral' },
  { key: 'utensils', label: 'Alimentação' },
  { key: 'home', label: 'Moradia' },
  { key: 'car', label: 'Transporte' },
  { key: 'shopping-bag', label: 'Compras' },
  { key: 'credit-card', label: 'Cartão' },
  { key: 'zap', label: 'Contas' },
  { key: 'gamepad-2', label: 'Lazer' },
  { key: 'heart-pulse', label: 'Saúde' },
  { key: 'graduation-cap', label: 'Educação' },
  { key: 'briefcase', label: 'Trabalho' },
  { key: 'laptop', label: 'Tech' },
  { key: 'trending-up', label: 'Investimentos' },
  { key: 'gift', label: 'Presentes' },
  { key: 'plane', label: 'Viagem' },
  { key: 'piggy-bank', label: 'Poupança' },
  { key: 'shield', label: 'Reserva' },
] as const;

export const COLOR_SWATCHES = [
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f59e0b',
  '#14b8a6',
];

export function CategoryIcon({
  icon,
  className = 'h-4 w-4',
  color,
}: {
  icon?: string | null;
  className?: string;
  color?: string;
}) {
  const Icon = (icon && ICON_MAP[icon]) || Tag;
  return <Icon className={className} style={color ? { color } : undefined} />;
}
