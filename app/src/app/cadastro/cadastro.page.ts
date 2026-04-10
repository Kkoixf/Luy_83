import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem, IonInput, IonCard, IonCardTitle, IonCardHeader, IonCardContent, IonLabel, IonBackButton, IonButtons } from '@ionic/angular/standalone'; // Adicionei inputs e buttons comuns
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Database } from '../services/database';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem, IonInput, CommonModule, FormsModule, IonCard, IonCardTitle, IonCardHeader, IonCardContent, IonLabel, IonBackButton, IonButtons]
})
export class CadastroPage implements OnInit {
  newUsername: string = '';
  newPassword: string = '';
  isLoginMode: boolean = true;
   username: string = '';
  password: string = '';

  constructor(
    private router: Router,
    private database: Database,
    private toastController: ToastController
  ) { }

  async ngOnInit() {
    await this.database.waitForDbReady();
    if (this.database.isLoggedIn()) {
      this.router.navigate(['/tabs/tab1']);
    }
  }

  async register() {
    console.log('Tentando registrar:', this.newUsername, this.newPassword);
    try {
      await this.database.register(this.newUsername, this.newPassword);
      await this.showToast('Usuário cadastrado com sucesso');
      this.toggleMode();
    } catch (error) {
      console.error('Erro no registro:', error);
      this.showToast('Erro ao cadastrar usuário: ' + (error as Error).message);
    }
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000
    });
    await toast.present();
  }
  irParaLogin() {
  // O caminho '/cadastro' deve ser o mesmo definido no seu app-routing.module.ts
  this.router.navigate(['/login']);
}
}
