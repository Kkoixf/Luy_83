import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton,
  IonButtons, IonSpinner, IonIcon
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { addIcons } from 'ionicons';
import { arrowBackOutline, mailOutline, checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-password-recovery',
  templateUrl: './password-recovery.page.html',
  styleUrls: ['./password-recovery.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
    IonInput, IonButton, IonButtons, IonSpinner, IonIcon
  ]
})
export class PasswordRecoveryPage {
  email: string = '';
  isLoading: boolean = false;
  emailSent: boolean = false;
  cooldownSegundos: number = 0;
  private cooldownTimer: any = null;

  constructor(
    private router: Router,
    private notify: NotificationService,
    private auth: Auth
  ) {
    addIcons({ arrowBackOutline, mailOutline, checkmarkCircleOutline });
  }

  ionViewWillLeave() {
    this.pararCooldown();
  }

  async recuperarSenha() {
    if (this.isLoading || this.cooldownSegundos > 0) return;

    const email = (this.email || '').trim().toLowerCase();

    if (!email) {
      this.notify.warning('Por favor, informe seu e-mail.');
      return;
    }

    if (!this.emailValido(email)) {
      this.notify.warning('Formato de e-mail inválido.');
      return;
    }

    this.isLoading = true;
    try {
      await sendPasswordResetEmail(this.auth, email);
      this.email = email;
      this.emailSent = true;
      this.iniciarCooldown(45);
      this.notify.success('E-mail enviado! Verifique também a caixa de spam.');
    } catch (error: any) {
      const code = error?.code || '';
      let message = 'Erro ao processar sua solicitação. Tente novamente.';

      if (code === 'auth/user-not-found') {
        // Por segurança, não revelar se o e-mail existe ou não.
        this.emailSent = true;
        this.iniciarCooldown(45);
        this.notify.info('Se o e-mail estiver cadastrado, você receberá o link em instantes. Verifique também o spam.');
        return;
      } else if (code === 'auth/invalid-email') {
        message = 'Formato de e-mail inválido.';
      } else if (code === 'auth/missing-email') {
        message = 'Informe o e-mail.';
      } else if (code === 'auth/too-many-requests') {
        message = 'Muitas tentativas. Aguarde alguns minutos.';
      } else if (code === 'auth/network-request-failed') {
        message = 'Sem conexão com a internet. Verifique sua rede.';
      }
      this.notify.error(message);
    } finally {
      this.isLoading = false;
    }
  }

  async reenviar() {
    if (this.cooldownSegundos > 0) return;
    this.emailSent = false;
    await this.recuperarSenha();
  }

  private emailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private iniciarCooldown(segundos: number) {
    this.pararCooldown();
    this.cooldownSegundos = segundos;
    this.cooldownTimer = setInterval(() => {
      this.cooldownSegundos--;
      if (this.cooldownSegundos <= 0) {
        this.pararCooldown();
      }
    }, 1000);
  }

  private pararCooldown() {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
    this.cooldownSegundos = 0;
  }

  voltar() {
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
