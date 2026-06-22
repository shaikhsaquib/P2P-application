import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/login']);
  return false;
};

export const supplierGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isSupplier();
};

export const buyerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return !auth.isSupplier();
};
