import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, BehaviorSubject, delay, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product, CartItem, OrderSummary, ProductCategory } from '../models/product.model';

/**
 * @service ProductService
 * Servicio principal de gestión de productos para TechMarket Perú.
 * Opera completamente con datos simulados (mock data) para garantizar
 * el funcionamiento de la SPA sin dependencia de un backend activo.
 *
 * Implementa el patrón Observable para mantener reactividad total
 * con la vista Angular. Migración futura a HttpClient requiere solo
 * reemplazar los métodos `of(...)` por llamadas HTTP reales.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {

  // ── Señales reactivas del carrito ─────────────────────────────────────────
  private _cart = signal<CartItem[]>([]);
  readonly cart = this._cart.asReadonly();
  readonly cartCount = computed(() =>
    this._cart().reduce((acc, item) => acc + item.quantity, 0)
  );
  readonly cartTotal = computed(() =>
    this._cart().reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
  );

  // ── Datos simulados de productos ──────────────────────────────────────────
  private readonly MOCK_PRODUCTS: Product[] = [
    {
      id: 1, name: 'ASUS ROG Zephyrus G14 2024',
      description: 'Laptop gaming ultra-delgada con AMD Ryzen 9 8945HS, NVIDIA RTX 4070, 32GB DDR5, pantalla OLED 2.8K 120Hz. Rendimiento profesional en un chasis de 1.65 kg.',
      price: 8999.00, stock: 12, category: 'Laptops', brand: 'ASUS',
      image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=400&q=80',
      rating: 4.8, reviewCount: 234, onSale: true, discountPct: 10
    },
    {
      id: 2, name: 'MacBook Air M3 15"',
      description: 'El portátil más delgado con chip Apple M3, 18 GB de memoria unificada, SSD de 512 GB y pantalla Liquid Retina de 15.3 pulgadas. Hasta 18 horas de batería.',
      price: 11299.00, stock: 8, category: 'Laptops', brand: 'Apple',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
      rating: 4.9, reviewCount: 512, onSale: false, discountPct: 0
    },
    {
      id: 3, name: 'Samsung Galaxy S24 Ultra',
      description: 'Smartphone flagship con Snapdragon 8 Gen 3, cámara de 200 MP con zoom óptico 10x, pantalla Dynamic AMOLED 6.8" 120Hz y S Pen integrado.',
      price: 5799.00, stock: 25, category: 'Smartphones', brand: 'Samsung',
      image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80',
      rating: 4.7, reviewCount: 891, onSale: true, discountPct: 15
    },
    {
      id: 4, name: 'iPhone 15 Pro Max',
      description: 'El iPhone más avanzado: chip A17 Pro de titanio, cámara principal de 48 MP con zoom óptico 5x, botón de Acción y puerto USB-C con velocidades USB 3.',
      price: 6899.00, stock: 15, category: 'Smartphones', brand: 'Apple',
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484bce71?w=400&q=80',
      rating: 4.8, reviewCount: 1203, onSale: false, discountPct: 0
    },
    {
      id: 5, name: 'LG UltraWide 34WQ75C-B',
      description: 'Monitor curvo UltraWide 34" WQHD (3440x1440) IPS, 60Hz, USB-C 65W, compatibilidad HDR10, ajuste de altura y tilt. Ideal para productividad y diseño.',
      price: 2999.00, stock: 7, category: 'Monitores', brand: 'LG',
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&q=80',
      rating: 4.6, reviewCount: 178, onSale: false, discountPct: 0
    },
    {
      id: 6, name: 'Samsung Odyssey G7 27"',
      description: 'Monitor gaming QLED curvo 27" QHD 240Hz, 1ms, G-Sync compatible, AMD FreeSync Premium Pro, HDR600. Curvatura 1000R para inmersión total.',
      price: 3499.00, stock: 5, category: 'Monitores', brand: 'Samsung',
      image: 'https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=400&q=80',
      rating: 4.7, reviewCount: 342, onSale: true, discountPct: 8
    },
    {
      id: 7, name: 'Logitech MX Keys S',
      description: 'Teclado inalámbrico premium con retroiluminación adaptativa, teclas de escritura perfecta, Bluetooth multi-dispositivo (3 equipos), recarga USB-C.',
      price: 549.00, stock: 40, category: 'Periféricos', brand: 'Logitech',
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
      rating: 4.7, reviewCount: 673, onSale: false, discountPct: 0
    },
    {
      id: 8, name: 'Logitech MX Master 3S',
      description: 'Mouse inalámbrico de alto rendimiento con MagSpeed Scroll, seguimiento de 8000 DPI en vidrio, 7 botones programables y carga USB-C.',
      price: 429.00, stock: 35, category: 'Periféricos', brand: 'Logitech',
      image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&q=80',
      rating: 4.8, reviewCount: 945, onSale: true, discountPct: 5
    },
    {
      id: 9, name: 'Sony WH-1000XM5',
      description: 'Auriculares inalámbricos con la mejor cancelación de ruido del mercado, 8 micrófonos, batería de 30h, plegables, audio Hi-Res y LDAC.',
      price: 1299.00, stock: 20, category: 'Audio', brand: 'Sony',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
      rating: 4.9, reviewCount: 1567, onSale: false, discountPct: 0
    },
    {
      id: 10, name: 'Apple AirPods Pro 2da Gen',
      description: 'Auriculares in-ear con cancelación activa de ruido H2, audio adaptativo, modo transparencia, Spatial Audio con seguimiento de cabeza, hasta 30h con estuche.',
      price: 1099.00, stock: 30, category: 'Audio', brand: 'Apple',
      image: 'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?w=400&q=80',
      rating: 4.8, reviewCount: 2341, onSale: true, discountPct: 12
    },
    {
      id: 11, name: 'iPad Pro M4 13"',
      description: 'La tablet más potente del mundo: chip M4, pantalla Ultra Retina XDR OLED 13" con ProMotion 120Hz, Face ID, USB-C Thunderbolt 4, compatible con Apple Pencil Pro.',
      price: 7499.00, stock: 6, category: 'Tablets', brand: 'Apple',
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80',
      rating: 4.9, reviewCount: 432, onSale: false, discountPct: 0
    },
    {
      id: 12, name: 'NVIDIA GeForce RTX 4070 Super',
      description: 'Tarjeta gráfica gaming de nueva generación, 12 GB GDDR6X, DLSS 3 Frame Generation, ray tracing en tiempo real, TDP 220W. Rinde en 1440p y 4K.',
      price: 3299.00, stock: 9, category: 'Componentes', brand: 'NVIDIA',
      image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&q=80',
      rating: 4.7, reviewCount: 287, onSale: true, discountPct: 7
    },
    {
      id: 13, name: 'TP-Link Archer AXE75',
      description: 'Router WiFi 6E tri-banda hasta 5400 Mbps, cobertura hasta 250 m², 4 antenas de alta ganancia, 1 puerto 2.5G WAN/LAN, gestión desde app Tether.',
      price: 599.00, stock: 18, category: 'Redes', brand: 'TP-Link',
      image: 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&q=80',
      rating: 4.5, reviewCount: 421, onSale: false, discountPct: 0
    },
    {
      id: 14, name: 'Samsung Galaxy Tab S9+',
      description: 'Tablet Android premium con Snapdragon 8 Gen 2, pantalla Dynamic AMOLED 12.4" 120Hz, S Pen incluido, IP68, DeX Mode para productividad desktop.',
      price: 4299.00, stock: 11, category: 'Tablets', brand: 'Samsung',
      image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&q=80',
      rating: 4.6, reviewCount: 318, onSale: true, discountPct: 10
    },
    {
      id: 15, name: 'Kingston FURY Beast DDR5 32GB',
      description: 'Kit de RAM DDR5 32 GB (2x16 GB) 6000 MHz CL36, compatible XMP 3.0 y AMD EXPO, disipador de aluminio de bajo perfil, para plataformas Intel y AMD.',
      price: 349.00, stock: 50, category: 'Componentes', brand: 'Kingston',
      image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&q=80',
      rating: 4.6, reviewCount: 156, onSale: false, discountPct: 0
    },
    {
      id: 16, name: 'Lenovo ThinkPad X1 Carbon Gen 12',
      description: 'Ultrabook empresarial con Intel Core Ultra 7, 32 GB LPDDR5, 1 TB SSD PCIe 4, pantalla IPS 14" FHD+, certificación MIL-SPEC y hasta 15h de autonomía.',
      price: 9499.00, stock: 4, category: 'Laptops', brand: 'Lenovo',
      image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&q=80',
      rating: 4.7, reviewCount: 198, onSale: false, discountPct: 0
    }
  ];

  // ── Métodos públicos ───────────────────────────────────────────────────────

  /**
   * Obtiene la lista completa de productos simulados.
   * Simula latencia de red real con delay de 400ms.
   */
  getProducts(): Observable<Product[]> {
    return of([...this.MOCK_PRODUCTS]).pipe(delay(400));
  }

  /**
   * Obtiene un producto por su ID.
   * @param id - Identificador numérico del producto
   */
  getProductById(id: number): Observable<Product | undefined> {
    const product = this.MOCK_PRODUCTS.find(p => p.id === id);
    return of(product).pipe(delay(200));
  }

  /**
   * Filtra productos por categoría y/o término de búsqueda.
   * @param category - Categoría a filtrar (undefined = todas)
   * @param search - Término de búsqueda sobre nombre y descripción
   */
  getFilteredProducts(
    category?: ProductCategory | 'Todos',
    search?: string
  ): Observable<Product[]> {
    let results = [...this.MOCK_PRODUCTS];

    if (category && category !== 'Todos') {
      results = results.filter(p => p.category === category);
    }

    if (search && search.trim().length > 0) {
      const term = search.toLowerCase().trim();
      results = results.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term)
      );
    }

    return of(results).pipe(delay(250));
  }

  /**
   * Retorna la lista de categorías únicas disponibles.
   */
  getCategories(): Observable<string[]> {
    const cats = ['Todos', ...new Set(this.MOCK_PRODUCTS.map(p => p.category))];
    return of(cats);
  }

  // ── Gestión del carrito ───────────────────────────────────────────────────

  addToCart(product: Product): void {
    const current = this._cart();
    const existing = current.find(item => item.product.id === product.id);
    if (existing) {
      this._cart.update(items =>
        items.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      this._cart.update(items => [...items, { product, quantity: 1 }]);
    }
  }

  removeFromCart(productId: number): void {
    this._cart.update(items => items.filter(i => i.product.id !== productId));
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    this._cart.update(items =>
      items.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }

  clearCart(): void {
    this._cart.set([]);
  }

  /**
   * Simula el envío de un pedido a la API REST.
   * Retorna un OrderSummary con estado 'confirmed' tras 800ms.
   */
  placeOrder(): Observable<OrderSummary> {
    const items = this._cart();
    if (items.length === 0) {
      return throwError(() => new Error('El carrito está vacío.'));
    }
    const order: OrderSummary = {
      id: `ORD-${Date.now()}`,
      items: [...items],
      total: this.cartTotal(),
      createdAt: new Date(),
      status: 'confirmed'
    };
    return of(order).pipe(delay(800));
  }
}
