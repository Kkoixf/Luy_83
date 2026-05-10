import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';

export const authGuard = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  // authState emite: undefined (estado inicial) → null (sem usuário) ou User (com usuário)
  // Precisamos filtrar apenas o `undefined` inicial e aguardar o primeiro estado real
  const user = await firstValueFrom(
    authState(auth).pipe(
      filter(u => u !== undefined) // null = sem usuário (válido), User = autenticado (válido)
    )
  );

  // Caso raro: se o Firebase demorar muito e emitir undefined persistentemente,
  // fazemos fallback direto via currentUser que já está resolvido
  const resolvedUser = user ?? auth.currentUser;

  if (resolvedUser) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};