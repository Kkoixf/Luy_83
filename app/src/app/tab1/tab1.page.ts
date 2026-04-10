import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Database } from '../services/database';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon]
})
export class Tab1Page implements OnInit {
  user: any = null;
  isConnected: boolean = false;

  constructor(private router: Router, private database: Database, private alertController: AlertController) {}

  ngOnInit() {
    this.user = this.database.getUser();
    this.isConnected = this.database.isConnectedToHand();
  }

  logout() {
    this.database.logout();
    this.router.navigate(['/login']);
  }

  async toggleConnection() {
    this.isConnected = !this.isConnected;
    this.database.setConnectedToHand(this.isConnected);

    const alert = await this.alertController.create({
      header: this.isConnected ? 'Conectado!' : 'Desconectado!',
      message: this.isConnected ? 'A mão robótica está conectada.' : 'A mão robótica foi desconectada.',
      buttons: ['OK']
    });

    await alert.present();
  }
}
