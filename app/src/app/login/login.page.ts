import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Database } from '../services/database';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton]
})
export class LoginPage implements OnInit {
  username: string = '';
  password: string = '';
  newUsername: string = '';
  newPassword: string = '';
  isLoginMode: boolean = true;

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

  irParaCadastro() {
    this.router.navigate(['/cadastro']);
  }

  irParaRecuperarSenha() {
    this.router.navigate(['/password-recovery']);
  }

  async login() {
    console.log('Tentando login com:', this.username, this.password);
    try {
      const user = await this.database.login(this.username, this.password);
      console.log('Usuário retornado:', user);
      if (user) {
        this.database.setUser(user);
        this.router.navigate(['/tabs/tab1']);
      } else {
        this.showToast('Usuário ou senha incorretos');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      this.showToast('Erro ao fazer login: ' + (error as Error).message);
    }
  }

  async register() {
    console.log('Tentando registrar:', this.newUsername, this.newPassword);
    try {
      await this.database.register(this.newUsername, this.newPassword);
      this.showToast('Usuário cadastrado com sucesso');
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
    toast.present();
  }
}
