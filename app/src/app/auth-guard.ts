import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Database } from './services/database';

export const authGuard: CanActivateFn = (route, state) => {
  const database = inject(Database);
  const router = inject(Router);

  if (database.isLoggedIn()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
