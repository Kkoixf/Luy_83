import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonItem,
  IonLabel, IonInput, IonButton, IonIcon, IonImg
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';
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
    IonContent, IonImg, IonHeader, IonTitle, IonToolbar, CommonModule,
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
    private notify: NotificationService,
    private auth: Auth,
    private firestore: Firestore,
    private database: Database
  ) {
    addIcons({ logoGoogle });
  }

  ngOnInit() {
    // Auto-login no cold start: só redireciona automaticamente quem já tem cadastro completo.
    // Um usuário autenticado SEM doc (ex.: cadastro Google não finalizado) permanece no login,
    // evitando o loop login <-> cadastro ao usar o botão "Voltar".
    this.authUnsubscribe = onAuthStateChanged(this.auth, async (user) => {
      if (user && !this.processandoLogin) {
        await this.redirecionarPosLogin(user.uid, false);
      }
    });
  }

  ngOnDestroy() {

    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
  }

  private async redirecionarPosLogin(uid: string, permitirCadastro = true) {
    try {
      const docRef = doc(this.firestore, 'usuarios', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        this.database.setUser(userData);
        await this.router.navigate(['/menu/home'], { replaceUrl: true });
      } else if (permitirCadastro) {
        await this.router.navigate(['/cadastro'], { replaceUrl: true });
      }
      // Sem doc e sem permissão de cadastro: permanece no login (evita o loop de telas).
    } catch (error) {
      console.error('Erro ao verificar cadastro:', error);
      this.notify.error('Erro ao verificar dados. Tente novamente.');
    }
  }

  async login() {
    if (this.processandoLogin) return;

    if (!this.email || !this.password) {
      this.notify.warning('Preencha todos os campos.');
      return;
    }

    const email = this.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.notify.warning('E-mail inválido.');
      return;
    }

    this.processandoLogin = true;

    try {
      const cred = await signInWithEmailAndPassword(
        this.auth,
        email,
        this.password
      );
      this.notify.success('Bem-vindo ao sistema Luy-83!');
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
      this.notify.error(mensagem);
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
        this.notify.error('Não foi possível obter credencial do Google.');
        return;
      }

      const credential = GoogleAuthProvider.credential(result.credential.idToken);
      const userCredential = await signInWithCredential(this.auth, credential);

      await this.redirecionarPosLogin(userCredential.user.uid);

    } catch (error: any) {
      const code = String(error?.code ?? '');
      const rawMsg = String(error?.message ?? '');
      const msg = rawMsg.toLowerCase();

      // Usuário cancelou — silenciar (comum no Android quando fecha o sheet)
      const cancelado =
        msg.includes('cancel') ||
        code === 'ERR_CANCELED' ||
        code === '12501' ||
        msg.includes('12501') ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request';

      if (cancelado) {
        return;
      }

      // Log completo para depuração (visível no Logcat do Android / DevTools)
      console.error('Erro Google login | code:', code, '| message:', rawMsg, '| objeto:', error);

      // SHA-1 não registrado no Firebase / config OAuth inválida (DEVELOPER_ERROR).
      // O plugin nativo costuma repassar o código 10 dentro da mensagem (ex.: "10:" ou
      // "ApiException: 10"), por isso checamos tanto o code quanto o texto.
      const developerError =
        code === '10' ||
        msg.includes('developer_error') ||
        msg.includes('apiexception: 10') ||
        /(^|[^0-9])10:/.test(msg);

      if (code === 'auth/network-request-failed' || msg.includes('network')) {
        this.notify.error('Sem conexão com a internet.');
      } else if (code === 'auth/account-exists-with-different-credential') {
        this.notify.warning('Já existe uma conta com este e-mail. Entre com a senha.');
      } else if (developerError) {
        this.notify.error('Configuração do Google inválida (SHA-1 não registrado no Firebase).');
      } else {
        // Mostra o código/mensagem real para facilitar o diagnóstico de falhas futuras.
        const detalhe = code || rawMsg || 'desconhecido';
        this.notify.error(`Erro ao autenticar com o Google (${detalhe}). Tente novamente.`);
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
}
