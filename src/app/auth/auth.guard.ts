import { Injectable } from '@angular/core';
import { CanLoad, Route, UrlSegment, Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate } from '@angular/router';
import { Observable, of } from 'rxjs';
import { take, tap, switchMap } from 'rxjs/operators';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanLoad, CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.isUserAuthenticated.pipe(
      take(1),
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          return this.authService.autoLogin();

        } else {
          return of(isAuthenticated);
        }
      }),
      tap(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigate(['/auth']);
        }
      })
    );
  }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
  Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.isUserAuthenticated.pipe(
      take(1),
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          return this.authService.autoLogin();

        } else {
          return of(isAuthenticated);
        }
      }),
      tap(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigate(['/auth']);
        }
      })
    );
  }
}
