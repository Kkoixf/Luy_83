import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';

export const authGuard = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

 
  const user = await firstValueFrom(
    authState(auth).pipe(
      filter(u => u !== undefined) 
    )
  );

  
  const resolvedUser = user ?? auth.currentUser;

  if (resolvedUser) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};