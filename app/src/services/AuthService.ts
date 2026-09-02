import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, Observable, Subscription } from 'rxjs';
import { takeWhile, tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import {Organization} from "../models/Organization";
import {environment} from "../environments/environment";

const GUARD_TOKEN_KEY = 'guardToken';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private resetTimerSubscription: Subscription | null = null;

  constructor(private router: Router, private http: HttpClient) {
    this.checkAuthentication();
    this.startResetTimer();
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  login(patrollerIdentifier: string): void {
    localStorage.setItem('patrollerIdentifier', patrollerIdentifier);
    localStorage.setItem('lastLoginTime', Date.now().toString());
    this.isAuthenticatedSubject.next(true);
    this.startResetTimer();
  }

  guardLogin(organizationId: string, patrollerIdentifier: string, pin: string): Observable<string> {
    return this.http.post<string>(`${environment.apiServer}/api/auth/guard-login`, { organizationId, patrollerIdentifier, pin })
      .pipe(tap(token => this.setGuardToken(token)));
  }

  setGuardToken(token: string): void {
    localStorage.setItem(GUARD_TOKEN_KEY, token);
  }

  getGuardToken(): string | null {
    return localStorage.getItem(GUARD_TOKEN_KEY);
  }

  removeGuardToken(): void {
    localStorage.removeItem(GUARD_TOKEN_KEY);
  }

  logout(): void {
    localStorage.removeItem('organization');
    localStorage.removeItem('patrollerIdentifier');
    localStorage.removeItem('lastLoginTime');
    this.removeGuardToken();
    this.isAuthenticatedSubject.next(false);
    if (this.resetTimerSubscription) {
      this.resetTimerSubscription.unsubscribe();
    }
    this.redirectToLogin();
  }

  getOrganization(): Organization | null {
    return JSON.parse(localStorage.getItem('organization') ?? 'null');
  }

  getPatrollerIdentifier(): string | null {
    return localStorage.getItem('patrollerIdentifier');
  }

  redirectToLogin() {
    this.router.navigate(['/login']);
  }

  private checkAuthentication(): void {
    const organizationId = this.getOrganization()?.id;
    const patrollerIdentifier = this.getPatrollerIdentifier();
    this.isAuthenticatedSubject.next(!!organizationId && !!patrollerIdentifier && this.hasValidGuardToken());
  }

  private hasValidGuardToken(): boolean {
    const token = this.getGuardToken();
    if (!token) {
      return false;
    }
    try {
      const payload = jwtDecode<{ exp?: number }>(token);
      return !!payload.exp && payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private async startResetTimerBackgroundAsync(): Promise<void> {
    try {
        const registration = await navigator.serviceWorker.ready;

        if ('periodicSync' in registration) {
          const periodicSync = (registration as any).periodicSync;

          try {
            await periodicSync.register('login-sync', {
              minInterval: 60 * 60 * 1000,
            });
            console.log('Periodic sync registered successfully!');
          } catch (error) {
            console.error('Periodic sync registration failed:', error);
          }
        } else {
          console.error('Periodic sync not supported in this browser.');
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
  }

  private startResetTimer(): void {
    if (this.resetTimerSubscription) {
      this.resetTimerSubscription.unsubscribe();
    }

    this.resetTimerSubscription = interval(60000) // Verifica cada minuto
      .pipe(takeWhile(() => this.isAuthenticated()))
      .subscribe(() => {
        const lastLoginTime = localStorage.getItem('lastLoginTime');
        if (lastLoginTime) {
          const hoursPassed = (Date.now() - parseInt(lastLoginTime, 10)) / (1000 * 60 * 60);
          if (hoursPassed >= 1) {
            this.resetPatrollerIdentifier();
          }
        }
      });
  }

  private resetPatrollerIdentifier(): void {
    localStorage.removeItem('patrollerIdentifier');
    localStorage.removeItem('lastLoginTime');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    if (this.resetTimerSubscription) {
      this.resetTimerSubscription.unsubscribe();
    }
  }

  setOrganization(organization: Organization) {
    localStorage.setItem('organization', JSON.stringify(organization));
  }
}
