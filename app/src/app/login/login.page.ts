import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonItem,
  IonLabel, IonInput, IonButton, IonIcon
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import {
  Auth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { addIcons } from 'ionicons';
import { logoGoogle } from 'ionicons/icons';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Database } from '../services/database';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule,
    FormsModule, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonIcon
  ]
})
export class LoginPage implements OnInit, OnDestroy {
  email: string = '';
  password: string = '';
  processandoLogin = false;

  private authUnsubscribe: (() => void) | null = null;

  constructor(
    private router: Router,
    private toastController: ToastController,
    private auth: Auth,
    private firestore: Firestore,
    private database: Database
  ) {
    addIcons({ logoGoogle });
  }

  ngOnInit() {
    
    this.authUnsubscribe = onAuthStateChanged(this.auth, async (user) => {
      if (user && !this.processandoLogin) {
        await this.redirecionarPosLogin(user.uid);
      }
    });
  }

  ngOnDestroy() {
    
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
  }

  private async redirecionarPosLogin(uid: string) {
    try {
      const docRef = doc(this.firestore, 'usuarios', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        this.database.setUser(userData);
        await this.router.navigate(['/tabs/tab1'], { replaceUrl: true });
      } else {
        await this.router.navigate(['/cadastro'], { replaceUrl: true });
      }
    } catch (error) {
      console.error('Erro ao verificar cadastro:', error);
      this.showToast('Erro ao verificar dados. Tente novamente.');
    }
  }

  async login() {
    if (this.processandoLogin) return;

    if (!this.email || !this.password) {
      this.showToast('Preencha todos os campos.');
      return;
    }

    const email = this.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showToast('E-mail inválido.');
      return;
    }

    this.processandoLogin = true;

    try {
      const cred = await signInWithEmailAndPassword(
        this.auth,
        email,
        this.password
      );
      this.showToast('Bem-vindo ao sistema Luy-83!');
      await this.redirecionarPosLogin(cred.user.uid);
    } catch (error: any) {
      let mensagem = 'Erro ao entrar.';
      const code = error?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        mensagem = 'E-mail ou senha incorretos.';
      } else if (code === 'auth/too-many-requests') {
        mensagem = 'Muitas tentativas. Tente novamente em alguns minutos.';
      } else if (code === 'auth/invalid-email') {
        mensagem = 'E-mail inválido.';
      } else if (code === 'auth/network-request-failed') {
        mensagem = 'Sem conexão com a internet.';
      } else if (code === 'auth/user-disabled') {
        mensagem = 'Esta conta foi desativada.';
      }
      this.showToast(mensagem);
    } finally {
      this.processandoLogin = false;
    }
  }

  async loginComGoogle() {
    if (this.processandoLogin) return;
    this.processandoLogin = true;

    try {
      const result = await FirebaseAuthentication.signInWithGoogle();

      if (!result.credential?.idToken) {
        this.showToast('Não foi possível obter credencial do Google.');
        return;
      }

      const credential = GoogleAuthProvider.credential(result.credential.idToken);
      const userCredential = await signInWithCredential(this.auth, credential);

      await this.redirecionarPosLogin(userCredential.user.uid);

    } catch (error: any) {
      const code = error?.code || '';
      const msg = (error?.message || '').toLowerCase();

      // Usuário cancelou — silenciar (comum no Android quando fecha o sheet)
      const cancelado =
        msg.includes('cancel') ||
        code === 'ERR_CANCELED' ||
        code === '12501' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request';

      if (cancelado) {
        return;
      }

      console.error('Erro Google login:', error);

      if (code === 'auth/network-request-failed' || msg.includes('network')) {
        this.showToast('Sem conexão com a internet.');
      } else if (code === 'auth/account-exists-with-different-credential') {
        this.showToast('Já existe uma conta com este e-mail. Entre com a senha.');
      } else if (code === '10' || msg.includes('developer_error')) {
        this.showToast('Configuração do Google inválida. Verifique o SHA-1 no Firebase.');
      } else {
        this.showToast('Erro ao autenticar com o Google. Tente novamente.');
      }
    } finally {
      this.processandoLogin = false;
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