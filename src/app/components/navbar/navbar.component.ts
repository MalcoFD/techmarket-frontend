import { Component, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  @Input() showCart = true;

  auth = inject(AuthService);
  productService = inject(ProductService);
  router = inject(Router);

  cartOpen = signal(false);

  logout(): void {
    this.productService.clearCart();
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  removeItem(id: number): void {
    this.productService.removeFromCart(id);
  }

  placeOrder(): void {
    this.productService.placeOrder().subscribe({
      next: (order) => {
        alert(`✅ Pedido ${order.id} confirmado. Total: S/ ${order.total.toFixed(2)}`);
        this.productService.clearCart();
        this.cartOpen.set(false);
      },
      error: (err) => alert(err.message)
    });
  }
}
