import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem, IonInput, IonCard, IonCardTitle, IonCardHeader, IonCardContent, IonLabel, IonBackButton, IonButtons, IonSelect, IonSelectOption, IonCheckbox } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular';
import { Database } from '../services/database';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem, IonInput, CommonModule, FormsModule, IonCard, IonCardTitle, IonCardHeader, IonCardContent, IonLabel, IonBackButton, IonButtons, IonSelect, IonSelectOption, IonCheckbox]
})
export class CadastroPage implements OnInit {
  newUsername: string = '';
  newPassword: string = '';

  dados = {
    nomeCompleto: '',
    genero: '',
    telefone: '',
    tipoProfissional: 'medico',
    crm: '',
    uf: '',
    cpf: '',
    especialidade: '',
    email: '',
    termsAccepted: false
  };

  estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  constructor(
    private router: Router,
    private database: Database,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

  async ngOnInit() {
    await this.database.waitForDbReady();
    if (this.database.isLoggedIn()) {
      this.router.navigate(['/tabs/tab1']);
    }
  }

  async register() {
    try {
      await this.database.register(this.newUsername, this.newPassword, this.dados);
      await this.showToast('Cadastro realizado com sucesso!');
      this.router.navigate(['/login']);
    } catch (error) {
      this.showToast('Erro ao cadastrar: ' + (error as Error).message);
    }
  }

  async mostrarTermos() {
    const alert = await this.alertController.create({
      header: 'Termos de Uso e Política de Privacidade',
      message: 'Este aplicativo é uma ferramenta de auxílio à triagem remota. As medições realizadas pela mão robótica Luy-83 devem ser conferidas pelo profissional responsável. O uso deste sistema implica na aceitação dos termos de privacidade e proteção de dados (LGPD). Os dados pessoais coletados serão utilizados exclusivamente para fins de identificação profissional e operação do sistema.',
      buttons: ['Entendi']
    });
    await alert.present();
  }

  formatarCpf(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }
    this.dados.cpf = value;
  }

  formatarTelefone(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    if (value.length > 6) {
      value = value.replace(/(\d{2})(\d{5})(\d{1,4})/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/(\d{2})(\d{1,5})/, '($1) $2');
    }
    this.dados.telefone = value;
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000
    });
    await toast.present();
  }
}
