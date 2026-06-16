import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { Product, ProductCategory } from '../../models/product.model';
import { NavbarComponent } from '../navbar/navbar.component';

/**
 * @component CatalogComponent
 * Vista principal del catálogo de productos TechMarket Perú.
 * Implementa búsqueda en tiempo real, filtro por categoría y
 * gestión del carrito mediante Angular Signals.
 */
@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './catalog.component.html'
})
export class CatalogComponent implements OnInit {
  productService = inject(ProductService);
  auth = inject(AuthService);

  // Estado reactivo con Signals
  allProducts = signal<Product[]>([]);
  isLoading = signal(true);
  searchTerm = signal('');
  selectedCategory = signal<string>('Todos');
  categories = signal<string[]>([]);
  addedProductId = signal<number | null>(null);
  viewMode = signal<'grid' | 'list'>('grid');
  sortBy = signal<'name' | 'price-asc' | 'price-desc' | 'rating'>('rating');

  // Productos filtrados reactivamente
  filteredProducts = computed(() => {
    let products = [...this.allProducts()];
    const term = this.searchTerm().toLowerCase().trim();
    const cat = this.selectedCategory();

    if (cat !== 'Todos') {
      products = products.filter(p => p.category === cat);
    }
    if (term) {
      products = products.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term)
      );
    }

    switch (this.sortBy()) {
      case 'name':        return products.sort((a, b) => a.name.localeCompare(b.name));
      case 'price-asc':   return products.sort((a, b) => a.price - b.price);
      case 'price-desc':  return products.sort((a, b) => b.price - a.price);
      case 'rating':      return products.sort((a, b) => b.rating - a.rating);
      default:            return products;
    }
  });

  ngOnInit(): void {
    this.productService.getProducts().subscribe(products => {
      this.allProducts.set(products);
      this.isLoading.set(false);
    });
    this.productService.getCategories().subscribe(cats => {
      this.categories.set(cats);
    });
  }

  addToCart(product: Product): void {
    this.productService.addToCart(product);
    this.addedProductId.set(product.id);
    setTimeout(() => this.addedProductId.set(null), 1500);
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  getDiscountedPrice(product: Product): number {
    return product.price * (1 - product.discountPct / 100);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(price);
  }

  getStockClass(stock: number): string {
    if (stock === 0)  return 'bg-red-500/15 text-red-400';
    if (stock <= 5)   return 'bg-amber-500/15 text-amber-400';
    return 'bg-green-500/15 text-green-400';
  }

  getStockLabel(stock: number): string {
    if (stock === 0)  return 'Sin stock';
    if (stock <= 5)   return `Últimas ${stock} unidades`;
    return `${stock} en stock`;
  }

  getRatingStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.round(rating) ? 1 : 0);
  }

  trackById(_i: number, p: Product): number { return p.id; }
}
