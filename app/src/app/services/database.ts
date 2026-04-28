import { Injectable, inject } from '@angular/core';
import { Auth, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';

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
        await this.loadUserData(user.uid);
      } else {
        this.currentUserData = null;
        localStorage.removeItem('user');
      }
    });
  }

  
  private async loadUserData(uid: string) {
    try {
      const docRef = doc(this.firestore, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        this.currentUserData = { uid, ...docSnap.data() };
       
        localStorage.setItem('user', JSON.stringify(this.currentUserData));
      }
    } catch (e) {
      console.error("Erro ao carregar dados do usuário:", e);
    }
  }


  
  async logout() {
    try {
      await signOut(this.auth); 
      this.currentUserData = null;
      localStorage.removeItem('user');
      localStorage.removeItem('handConnected');
      console.log('Sessão encerrada com sucesso.');
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
    }
  }

  
  getUser() {
    if (this.currentUserData) return this.currentUserData;
    const local = localStorage.getItem('user');
    return local ? JSON.parse(local) : null;
  }

  async markFirstLoginDone() {
    const user = this.auth.currentUser;
    if (user) {
      const docRef = doc(this.firestore, 'usuarios', user.uid);
      await updateDoc(docRef, { firstLogin: false });
    
      if (this.currentUserData) {
        this.currentUserData.firstLogin = false;
        localStorage.setItem('user', JSON.stringify(this.currentUserData));
      }
    }
  }


  
  async deleteAccount(): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      await deleteDoc(doc(this.firestore, 'usuarios', user.uid));
      await user.delete();
      await this.logout();
    }
  }



  isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }

  isConnectedToHand(): boolean {
    return localStorage.getItem('handConnected') === 'true';
  }

  setConnectedToHand(connected: boolean) {
    localStorage.setItem('handConnected', connected.toString());
  }

  setUser(user: any) {
    this.currentUserData = user;
    localStorage.setItem('user', JSON.stringify(user));
  }
}