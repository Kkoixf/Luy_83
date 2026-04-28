import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, IonItem, 
  IonLabel, IonInput, IonButton 
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

// --- IMPORTS DO FIREBASE ---
import { Auth, signInWithEmailAndPassword, onAuthStateChanged } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, 
    FormsModule, IonCard, IonCardHeader, IonCardTitle, 
    IonCardContent, IonItem, IonLabel, IonInput, IonButton
  ]
})
export class LoginPage implements OnInit {
  // O Firebase usa E-mail, então certifique-se que o campo no HTML envie um e-mail válido
  username: string = ''; 
  password: string = '';

  constructor(
    private router: Router,
    private toastController: ToastController,
    private auth: Auth // Injeção do Firebase Auth
  ) { }

  ngOnInit() {

    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.router.navigate(['/tabs/tab1']);
      }
    });
  }

  async login() {
    if (!this.username || !this.password) {
      this.showToast('Preencha todos os campos.');
      return;
    }

    try {
  
      await signInWithEmailAndPassword(this.auth, this.username, this.password);
      
      this.showToast('Bem-vindo ao sistema Luy-83!');
      this.router.navigate(['/tabs/tab1']);
    } catch (error: any) {
      let mensagem = 'Erro ao entrar';

    
      if (error.code === 'auth/invalid-credential') {
        mensagem = 'E-mail ou senha incorretos.';
      } else if (error.code === 'auth/invalid-email') {
        mensagem = 'Formato de e-mail inválido.';
      }

      this.showToast(mensagem);
      console.error('Erro no login:', error);
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