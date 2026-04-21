import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonButtons } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Database } from '../services/database';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonButtons]
})
export class Tab1Page implements OnInit {
  user: any = null;
  isConnected: boolean = false;

  constructor(
    private router: Router,
    private database: Database,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.user = this.database.getUser();
    this.isConnected = this.database.isConnectedToHand();
  }

  ionViewWillEnter() {
    this.user = this.database.getUser();
    this.isConnected = this.database.isConnectedToHand();
    this.verificarPrimeiroLogin();
  }

  getNomeCurto(): string {
    if (this.user?.nomeCompleto) {
      const partes = this.user.nomeCompleto.split(' ');
      return partes[0];
    }
    return this.user?.username || 'Usuário';
  }

  async verificarPrimeiroLogin() {
    if (this.user?.firstLogin) {
      const alert = await this.alertController.create({
        header: 'Termo de Uso',
        message: 'Este aplicativo é uma ferramenta de auxílio à triagem remota. As medições realizadas pela mão robótica Luy-83 devem ser conferidas pelo profissional responsável. O uso deste sistema implica na aceitação dos termos de privacidade e proteção de dados (LGPD).',
        buttons: [
          {
            text: 'Li e aceito',
            handler: () => {
              this.database.markFirstLoginDone();
              this.user = this.database.getUser();
            }
          }
        ],
        backdropDismiss: false
      });
      await alert.present();
    }
  }

  irParaPerfil() {
    this.router.navigate(['/perfil']);
  }

  logout() {
    this.database.logout();
    this.router.navigate(['/login']);
  }
}
