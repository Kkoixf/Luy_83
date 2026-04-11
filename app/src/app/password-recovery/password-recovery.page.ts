import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonBackButton, IonButtons, IonSpinner } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Database } from '../services/database';
import { ToastController } from '@ionic/angular';

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
  recoveryToken: string = '';

  constructor(
    private router: Router,
    private database: Database,
    private toastController: ToastController
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
      const user = await this.database.findUserByEmail(this.email);

      if (!user) {
        this.showToast('Email não encontrado no sistema');
        this.isLoading = false;
        return;
      }

      // Gerar token e simular envio de email
      const result = await this.database.sendPasswordResetEmail(this.email);

      if (result.success) {
        this.emailSent = true;
        this.recoveryToken = result.token;
        this.showToast('Email de recuperação enviado com sucesso!');
        console.log('Token para testes:', result.token);
      } else {
        this.showToast('Erro ao enviar email de recuperação');
      }
    } catch (error) {
      console.error('Erro ao recuperar senha:', error);
      this.showToast('Erro ao processar sua solicitação');
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
