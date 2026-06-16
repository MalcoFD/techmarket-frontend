import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  avatar: string;
}

/**
 * @service AuthService
 * Servicio de autenticación simulada para TechMarket Perú.
 * Valida credenciales contra un conjunto de usuarios mock y gestiona
 * el estado de sesión mediante localStorage con señales reactivas de Angular.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly SESSION_KEY = 'techmarket_session';

  private _currentUser = signal<AuthUser | null>(this.loadSession());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = () => this._currentUser() !== null;

  private readonly MOCK_USERS: (AuthUser & { password: string })[] = [
    {
      id: 1, name: 'Admin TechMarket', email: 'admin@techmarket.pe',
      password: 'Admin123!', role: 'admin',
      avatar: 'https://ui-avatars.com/api/?name=Admin+TechMarket&background=1e40af&color=fff'
    },
    {
      id: 2, name: 'Carlos Quispe', email: 'carlos@email.com',
      password: 'Carlos123!', role: 'customer',
      avatar: 'https://ui-avatars.com/api/?name=Carlos+Quispe&background=0f766e&color=fff'
    },
    {
      id: 3, name: 'Demo User', email: 'demo@techmarket.pe',
      password: 'Demo123!', role: 'customer',
      avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=7e22ce&color=fff'
    }
  ];

  login(credentials: LoginCredentials): Observable<AuthUser> {
    const user = this.MOCK_USERS.find(
      u => u.email === credentials.email && u.password === credentials.password
    );
    if (!user) {
      return new Observable(obs => {
        setTimeout(() => {
          obs.error(new Error('Credenciales incorrectas. Verifica tu email y contraseña.'));
        }, 600);
      });
    }
    const { password: _, ...authUser } = user;
    return of(authUser).pipe(delay(600));
  }

  setSession(user: AuthUser): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    this._currentUser.set(user);
  }

  logout(): void {
    localStorage.removeItem(this.SESSION_KEY);
    this._currentUser.set(null);
  }

  private loadSession(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
