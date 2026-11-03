import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { User } from '../models/user';
import { AuthService } from '../services/auth.service';

export const AuthGuard: (requiredRole: User['role']) => CanActivateFn = (requiredRole) => {
  return (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      return router.parseUrl('/login');
    }

    return authService.getUser().pipe(
      map((restoredUser) => {
        if (restoredUser.role === requiredRole) {
          return true;
        }

        const dashboard = restoredUser.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
        return router.parseUrl(state.url === dashboard ? '/login' : dashboard);
      }),
      catchError((error) => of(redirectAfterRestoreFailure(authService, router, error))),
    );
  };
};

export const AnyAuthenticatedGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.parseUrl('/login');
  }

  return authService.getUser().pipe(
    map(() => true),
    catchError((error) => of(redirectAfterRestoreFailure(authService, router, error))),
  );
};

function redirectAfterRestoreFailure(
  authService: AuthService,
  router: Router,
  error: { status?: number },
) {
  if (error.status === 401 || error.status === 403) {
    authService.clearSession();
  }

  return router.parseUrl('/login');
}
