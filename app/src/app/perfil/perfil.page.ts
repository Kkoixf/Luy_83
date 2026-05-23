import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonButton, IonIcon, IonItem, IonLabel,
  IonList, IonButtons, IonBackButton, IonInput
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { Database } from '../services/database';
import { addIcons } from 'ionicons';
import {
  personCircle, mailOutline, callOutline, cardOutline, personOutline,
  informationCircleOutline, headsetOutline, trashOutline, chevronForwardOutline,
  cameraOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon,
    IonItem, IonLabel, IonList, IonButtons, IonBackButton, IonInput
  ]
})
export class PerfilPage implements OnInit {
  user: any = null;
  fotoPerfil: string | null = null;

  private readonly MAX_FOTO_BYTES = 700_000;

  @ViewChild('fotoInput', { static: false }) fotoInputRef?: ElementRef<HTMLInputElement>;

  constructor(
    private router: Router,
    private database: Database,
    private alertController: AlertController,
    private toastController: ToastController,
    private auth: Auth,
    private firestore: Firestore
  ) {
    addIcons({
      personCircle, mailOutline, callOutline, cardOutline, personOutline,
      informationCircleOutline, headsetOutline, trashOutline, chevronForwardOutline,
      cameraOutline
    });
  }

  ngOnInit() {
    this.user = this.database.getUser();
    this.carregarFoto();
  }

  ionViewWillEnter() {
    this.user = this.database.getUser();
    this.carregarFoto();
  }

  private carregarFoto() {
    this.fotoPerfil =
      this.user?.fotoPerfil ||
      this.auth.currentUser?.photoURL ||
      null;
  }

  abrirSeletorFoto() {
    this.fotoInputRef?.nativeElement.click();
  }

  async aoSelecionarFoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Selecione um arquivo de imagem válido.');
      input.value = '';
      return;
    }

    try {
      const dataUrl = await this.lerComoDataUrl(file);
      const otimizada = await this.redimensionarImagem(dataUrl, 400);

      if (otimizada.length > this.MAX_FOTO_BYTES) {
        this.showToast('Imagem muito grande. Tente uma menor.');
        input.value = '';
        return;
      }

      this.fotoPerfil = otimizada;
      await this.salvarFoto(otimizada);
      this.showToast('Foto de perfil atualizada!');
    } catch (err) {
      console.error('Erro ao processar foto:', err);
      this.showToast('Não foi possível salvar a foto.');
    } finally {
      input.value = '';
    }
  }

  async removerFoto() {
    const alert = await this.alertController.create({
      header: 'Remover foto',
      message: 'Deseja remover sua foto de perfil?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Remover',
          handler: async () => {
            this.fotoPerfil = null;
            await this.salvarFoto(null);
            this.showToast('Foto removida.');
          }
        }
      ]
    });
    await alert.present();
  }

  private lerComoDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private redimensionarImagem(dataUrl: string, maxLado: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas indisponível')); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = dataUrl;
    });
  }

  private async salvarFoto(dataUrl: string | null) {
    const usuarioAtual = this.auth.currentUser;
    if (usuarioAtual) {
      try {
        await updateDoc(doc(this.firestore, 'usuarios', usuarioAtual.uid), {
          fotoPerfil: dataUrl
        });
      } catch (err) {
        console.warn('Não foi possível persistir a foto no Firestore:', err);
      }
    }
    const atualizado = { ...(this.user || {}), fotoPerfil: dataUrl };
    this.database.setUser(atualizado);
    this.user = atualizado;
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
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

   async logout() {
    const alert = await this.alertController.create({
      header: 'Sair da conta',
      message: 'Tem certeza que deseja encerrar sua sessão?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sair',
          role: 'destructive',
          handler: async () => {
            await this.database.logout();
            this.router.navigate(['/login'], { replaceUrl: true });
          }
        }
      ]
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
            try {
              await this.database.deleteAccount();
              const toast = await this.toastController.create({
                message: 'Conta deletada com sucesso.',
                duration: 2000
              });
              await toast.present();
              this.router.navigate(['/login'], { replaceUrl: true });
            } catch (error: any) {
              const toast = await this.toastController.create({
                message: error.message || 'Erro ao deletar conta.',
                duration: 2000,
                color: 'danger'
              });
              await toast.present();
            }
          }
        }
      ]
    });
    await alert.present();
  }
}
