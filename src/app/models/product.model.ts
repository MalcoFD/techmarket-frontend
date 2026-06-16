/**
 * @interface Product
 * Representa la entidad de producto del catálogo TechMarket Perú.
 * Diseñado para ser agnóstico al backend; los datos son servidos
 * por un mock service hasta que la API REST esté disponible.
 */
export interface Product {
  /** Identificador único del producto (UUID o ID numérico de backend) */
  id: number;
  /** Nombre comercial del producto */
  name: string;
  /** Descripción técnica y de marketing */
  description: string;
  /** Precio en soles peruanos (PEN) */
  price: number;
  /** Unidades disponibles en inventario */
  stock: number;
  /** URL o path de la imagen del producto */
  image: string;
  /** Categoría principal del producto */
  category: ProductCategory;
  /** Marca del fabricante */
  brand: string;
  /** Puntuación de rating (0-5) */
  rating: number;
  /** Número total de reseñas */
  reviewCount: number;
  /** Indica si el producto tiene descuento activo */
  onSale: boolean;
  /** Porcentaje de descuento (0 si no aplica) */
  discountPct: number;
}

/**
 * @type ProductCategory
 * Enum de categorías de productos tecnológicos soportadas.
 */
export type ProductCategory =
  | 'Laptops'
  | 'Smartphones'
  | 'Monitores'
  | 'Periféricos'
  | 'Audio'
  | 'Tablets'
  | 'Componentes'
  | 'Redes';

/**
 * @interface CartItem
 * Representa un ítem dentro del carrito de pedidos temporal.
 */
export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * @interface OrderSummary
 * Resumen de un pedido simulado para confirmación.
 */
export interface OrderSummary {
  id: string;
  items: CartItem[];
  total: number;
  createdAt: Date;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped';
}
