import { Injectable, inject } from '@angular/core';
import {
  Auth, signOut, onAuthStateChanged,
  EmailAuthProvider, reauthenticateWithCredential,
  GoogleAuthProvider, reauthenticateWithCredential as reauthCred
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

@Injectable({
  providedIn: 'root',
})
export class Database {

  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);

  private currentUserData: any = null;

  constructor() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        // Só recarrega do Firestore se ainda não tivermos os dados
        // (evita sobrescrever dados recém-salvos pelo cadastro/login)
        if (!this.currentUserData || this.currentUserData.uid !== user.uid) {
          await this.loadUserData(user.uid);
        }
      } else {
        this.currentUserData = null;
        try { localStorage.removeItem('user'); } catch {}
      }
    });
  }

  private async loadUserData(uid: string) {
    try {
      const docRef = doc(this.firestore, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        this.currentUserData = { uid, ...docSnap.data() };
        try {
          localStorage.setItem('user', JSON.stringify(this.currentUserData));
        } catch {}
      }
    } catch (e) {
      console.error('Erro ao carregar dados do usuário:', e);
    }
  }

  async logout() {
    try {
      // No Android, encerrar também a sessão do plugin nativo
      try { await FirebaseAuthentication.signOut(); } catch {}
      await signOut(this.auth);
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
    } finally {
      this.currentUserData = null;
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('handConnected');
      } catch {}
    }
  }

  getUser() {
    if (this.currentUserData) return this.currentUserData;
    try {
      const local = localStorage.getItem('user');
      return local ? JSON.parse(local) : null;
    } catch {
      return null;
    }
  }

  async markFirstLoginDone() {
    const user = this.auth.currentUser;
    if (user) {
      const docRef = doc(this.firestore, 'usuarios', user.uid);
      await updateDoc(docRef, { firstLogin: false });

      if (this.currentUserData) {
        this.currentUserData.firstLogin = false;
        try {
          localStorage.setItem('user', JSON.stringify(this.currentUserData));
        } catch {}
      }
    }
  }

  /**
   * Reautentica o usuário antes de operações sensíveis (delete).
   * - Conta e-mail/senha: usa a senha informada
   * - Conta Google: reabre o popup do Google
   */
  async reautenticar(senha?: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado.');

    const isGoogle = user.providerData.some(p => p.providerId === 'google.com');

    if (isGoogle) {
      const result = await FirebaseAuthentication.signInWithGoogle();
      if (!result.credential?.idToken) {
        throw new Error('Não foi possível confirmar com o Google.');
      }
      const credential = GoogleAuthProvider.credential(result.credential.idToken);
      await reauthCred(user, credential);
    } else {
      if (!senha) throw new Error('Senha obrigatória para confirmar.');
      if (!user.email) throw new Error('Conta sem e-mail vinculado.');
      const credential = EmailAuthProvider.credential(user.email, senha);
      await reauthenticateWithCredential(user, credential);
    }
  }

  async deleteAccount(senha?: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado.');

    try {
      await this.reautenticar(senha);
    } catch (e: any) {
      const code = e?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        throw new Error('Senha incorreta.');
      }
      if (code === 'auth/network-request-failed') {
        throw new Error('Sem conexão com a internet.');
      }
      throw new Error(e?.message || 'Não foi possível confirmar sua identidade.');
    }

    try {
      await deleteDoc(doc(this.firestore, 'usuarios', user.uid));
    } catch (e) {
      console.warn('Erro ao remover documento Firestore:', e);
    }

    await user.delete();
    await this.logout();
  }

  isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }

  isConnectedToHand(): boolean {
    try { return localStorage.getItem('handConnected') === 'true'; } catch { return false; }
  }

  setConnectedToHand(connected: boolean) {
    try { localStorage.setItem('handConnected', connected.toString()); } catch {}
  }

  setUser(user: any) {
    this.currentUserData = user;
    try { localStorage.setItem('user', JSON.stringify(user)); } catch {}
  }
}
