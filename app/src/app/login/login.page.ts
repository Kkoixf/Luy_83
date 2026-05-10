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
export class LoginPage implements OnInit {
  email: string = '';
  password: string = '';
  // Flag para evitar redirecionamento duplo durante fluxo de login ativo
  private processandoLogin = false;

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
    const unsubscribe = onAuthStateChanged(this.auth, async (user) => {
      if (user && !this.processandoLogin) {
        unsubscribe();
        await this.redirecionarPosLogin(user.uid);
      }
    });
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
        // Usuário autenticado mas sem cadastro completo — vai para cadastro
        await this.router.navigate(['/cadastro'], { replaceUrl: true });
      }
    } catch (error) {
      console.error('Erro ao verificar cadastro:', error);
      this.showToast('Erro ao verificar dados. Tente novamente.');
    }
  }

  async login() {
    if (!this.email || !this.password) {
      this.showToast('Preencha todos os campos.');
      return;
    }

    this.processandoLogin = true;

    try {
      const cred = await signInWithEmailAndPassword(
        this.auth,
        this.email.trim(),
        this.password
      );
      this.showToast('Bem-vindo ao sistema Luy-83!');
      await this.redirecionarPosLogin(cred.user.uid);
    } catch (error: any) {
      let mensagem = 'Erro ao entrar.';
      if (
        error?.code === 'auth/invalid-credential' ||
        error?.code === 'auth/wrong-password' ||
        error?.code === 'auth/user-not-found'
      ) {
        mensagem = 'E-mail ou senha incorretos.';
      } else if (error?.code === 'auth/too-many-requests') {
        mensagem = 'Muitas tentativas. Tente novamente em alguns minutos.';
      } else if (error?.code === 'auth/invalid-email') {
        mensagem = 'E-mail inválido.';
      }
      this.showToast(mensagem);
    } finally {
      this.processandoLogin = false;
    }
  }

  async loginComGoogle() {
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
      if (error.message !== 'cancel' && error.code !== 'ERR_CANCELED') {
        console.error('Erro Google login:', error);
        this.showToast('Erro ao autenticar com o Google.');
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