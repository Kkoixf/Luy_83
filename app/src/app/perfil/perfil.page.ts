import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonItem, IonLabel, IonList, IonButtons, IonBackButton, IonInput } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Database } from '../services/database';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonItem, IonLabel, IonList, IonButtons, IonBackButton, IonInput]
})
export class PerfilPage implements OnInit {
  user: any = null;

  constructor(
    private router: Router,
    private database: Database,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.user = this.database.getUser();
  }

  ionViewWillEnter() {
    this.user = this.database.getUser();
  }

  formatarGenero(genero: string): string {
    const map: any = {
      'masculino': 'Masculino',
      'feminino': 'Feminino',
      'outro': 'Outro',
      'prefiro_nao_dizer': 'Prefiro não dizer'
    };
    return map[genero] || 'Não informado';
  }

  async mostrarSobreLuy() {
    const alert = await this.alertController.create({
      header: 'Sobre o Luy-83',
      message: 'O Luy-83 é uma mão robótica desenvolvida para auxiliar profissionais de saúde na triagem remota de pacientes. O dispositivo permite a medição de sinais vitais como temperatura, oxigenação e batimentos cardíacos à distância, conectando-se ao aplicativo via Wi-Fi e Bluetooth.',
      buttons: ['Fechar']
    });
    await alert.present();
  }

  async confirmarDeletarConta() {
    const alert = await this.alertController.create({
      header: 'Deletar Conta',
      message: 'Tem certeza? Todos os seus dados e registros de pacientes serão apagados permanentemente.',
      inputs: [
        {
          name: 'senha',
          type: 'password',
          placeholder: 'Digite sua senha para confirmar'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Deletar',
          cssClass: 'alert-button-danger',
          handler: async (data) => {
            if (data.senha === this.user?.password) {
              await this.database.deleteAccount();
              const toast = await this.toastController.create({
                message: 'Conta deletada com sucesso.',
                duration: 2000
              });
              await toast.present();
              this.router.navigate(['/login']);
            } else {
              const toast = await this.toastController.create({
                message: 'Senha incorreta.',
                duration: 2000,
                color: 'danger'
              });
              await toast.present();
              return false;
            }
            return;
          }
        }
      ]
    });
    await alert.present();
  }
}
