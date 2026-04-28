import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonBackButton, IonButtons, IonSpinner } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';

@Component({
  selector: 'app-password-recovery',
  templateUrl: './password-recovery.page.html',
  styleUrls: ['./password-recovery.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonBackButton, IonButtons, IonSpinner]
})
export class PasswordRecoveryPage implements OnInit {
  email: string = '';
  isLoading: boolean = false;
  emailSent: boolean = false;

  constructor(
    private router: Router,
    private toastController: ToastController,
    private auth: Auth
  ) { }

  ngOnInit() {
  }

  async recuperarSenha() {
    if (!this.email) {
      this.showToast('Por favor, informe seu email');
      return;
    }

    this.isLoading = true;
    try {
      await sendPasswordResetEmail(this.auth, this.email);
      this.emailSent = true;
      this.showToast('Email de recuperação enviado com sucesso!');
    } catch (error: any) {
      let message = 'Erro ao processar sua solicitação';
      if (error.code === 'auth/user-not-found') {
        message = 'Email não encontrado no sistema';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Formato de email inválido';
      }
      this.showToast(message);
    } finally {
      this.isLoading = false;
    }
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }

  voltar() {
    this.router.navigate(['/login']);
  }
}