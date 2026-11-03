import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { User } from '../models/user';
import { AuthService } from '../services/auth.service';

export const AuthGuard: (requiredRole: User['role']) => CanActivateFn = (requiredRole) => {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.user();

    if (authService.isLoggedIn() && user && user.role === requiredRole) {
      return true;
    }

    return router.parseUrl('/login');
  };
};

export const AnyAuthenticatedGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isLoggedIn() ? true : router.parseUrl('/login');
};
