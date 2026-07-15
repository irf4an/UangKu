import { Utensils, Car, Heart, Receipt, Gamepad2, ShoppingBag, BookOpen, MoreHorizontal } from 'lucide-react'

export interface CategoryUiConfig {
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}

export const getCategoryUi = (category: string): CategoryUiConfig => {
  switch (category) {
    case 'makanan':
      return { icon: <Utensils className="h-4 w-4 text-amber-700" />, colorClass: 'bg-amber-500', bgClass: 'bg-amber-50' };
    case 'transportasi':
      return { icon: <Car className="h-4 w-4 text-blue-700" />, colorClass: 'bg-blue-500', bgClass: 'bg-blue-50' };
    case 'kesehatan':
      return { icon: <Heart className="h-4 w-4 text-red-700" />, colorClass: 'bg-red-500', bgClass: 'bg-red-50' };
    case 'tagihan':
      return { icon: <Receipt className="h-4 w-4 text-purple-700" />, colorClass: 'bg-purple-500', bgClass: 'bg-purple-50' };
    case 'hiburan':
      return { icon: <Gamepad2 className="h-4 w-4 text-pink-700" />, colorClass: 'bg-pink-500', bgClass: 'bg-pink-50' };
    case 'belanja':
      return { icon: <ShoppingBag className="h-4 w-4 text-orange-700" />, colorClass: 'bg-orange-500', bgClass: 'bg-orange-50' };
    case 'pendidikan':
      return { icon: <BookOpen className="h-4 w-4 text-cyan-700" />, colorClass: 'bg-cyan-500', bgClass: 'bg-cyan-50' };
    default:
      return { icon: <MoreHorizontal className="h-4 w-4 text-stone-700" />, colorClass: 'bg-stone-500', bgClass: 'bg-stone-100' };
  }
}
