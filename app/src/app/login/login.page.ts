import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonItem,
  IonLabel, IonInput, IonButton, IonIcon
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import {
  Auth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule,
    FormsModule, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonItem, IonLabel, IonInput, IonButton,IonIcon
  ]
})
export class LoginPage implements OnInit {
  username: string = '';
  password: string = '';

  constructor(
    private router: Router,
    private toastController: ToastController,
    private auth: Auth,
    private firestore: Firestore
  ) { addIcons({ logoGoogle }); }

  ngOnInit() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        await this.redirecionarPosLogin(user.uid);
      }
    });
  }

  private async redirecionarPosLogin(uid: string) {
    const docRef = doc(this.firestore, 'usuarios', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      this.router.navigate(['/tabs/tab1']);
    } else {
      this.router.navigate(['/cadastro']);
    }
  }

  async login() {
    if (!this.username || !this.password) {
      this.showToast('Preencha todos os campos.');
      return;
    }

    const usernameKey = this.username.trim().toLowerCase();

    try {
      const usernameRef = doc(this.firestore, 'usernames', usernameKey);
      const snap = await getDoc(usernameRef);

      if (!snap.exists()) {
        this.showToast('Username não encontrado.');
        return;
      }

      const email = (snap.data() as any).email;
      if (!email) {
        this.showToast('Conta sem e-mail vinculado. Use login com Google.');
        return;
      }

      const cred = await signInWithEmailAndPassword(this.auth, email, this.password);
      this.showToast('Bem-vindo ao sistema Luy-83!');
      await this.redirecionarPosLogin(cred.user.uid);
    } catch (error: any) {
      console.error('[Login] erro:', error?.code, error?.message);
      let mensagem = 'Erro ao entrar';
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password') {
        mensagem = 'Username ou senha incorretos.';
      } else if (error?.code === 'auth/too-many-requests') {
        mensagem = 'Muitas tentativas. Tente novamente em alguns minutos.';
      }
      this.showToast(mensagem);
    }
  }

  async loginComGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(this.auth, provider);
      await this.redirecionarPosLogin(result.user.uid);
    } catch (error: any) {
      console.error('[Google Login] Falha completa:', error);
      console.error('[Google Login] code:', error?.code, '| message:', error?.message);

      let mensagem = 'Erro ao autenticar com o Google.';
      switch (error?.code) {
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
          mensagem = 'Login cancelado.';
          break;
        case 'auth/popup-blocked':
          mensagem = 'Popup bloqueado pelo navegador. Permita popups para este site.';
          break;
        case 'auth/operation-not-allowed':
          mensagem = 'Login com Google não está habilitado no Firebase.';
          break;
        case 'auth/unauthorized-domain':
          mensagem = 'Domínio não autorizado no Firebase Auth.';
          break;
        case 'auth/network-request-failed':
          mensagem = 'Falha de rede. Verifique sua conexão.';
          break;
        case 'auth/account-exists-with-different-credential':
          mensagem = 'Já existe uma conta com este e-mail usando outro método.';
          break;
        default:
          if (error?.code) {
            mensagem = `Erro Google: ${error.code}`;
          }
      }
      this.showToast(mensagem);
    }
  }

  irParaCadastro() {
    this.router.navigate(['/cadastro']);
  }

  irParaRecuperarSenha() {
    this.router.navigate(['/password-recovery']);
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
}
