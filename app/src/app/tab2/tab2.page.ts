import { Component } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonGrid, IonRow, IonCol, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonList, IonItem, IonLabel,
  IonSegment, IonSegmentButton, IonSpinner
} from '@ionic/angular/standalone';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Preferences } from '@capacitor/preferences';
import { addIcons } from 'ionicons';
import {
  handRightOutline, thumbsUpOutline, thermometerOutline,
  leafOutline, heartHalf, arrowRedoCircleOutline, wifiOutline,
  bluetoothOutline, chevronForwardOutline
} from 'ionicons/icons';
import { DatabaseService } from '../services/sqlite';
import { CapacitorHttp } from '@capacitor/core';
import { BleService } from '../services/Ble.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonGrid, IonRow, IonCol, IonCard, IonCardContent,
    IonButton, IonIcon, IonText, IonList, IonItem, IonLabel,
    IonSegment, IonSegmentButton, IonSpinner,
    CommonModule, FormsModule, AsyncPipe
  ],
})
export class Tab2Page {

  modoConexao: 'wifi' | 'bluetooth' = 'wifi';
  ipEsp32 = '192.168.0.23';
  pacienteAtivoId = 1;


  bleConectado$  = this.bleService.conectado$;
  bleStatus$     = this.bleService.statusMsg$;
  bleConectando$ = this.bleService.conectando$;

  sensores = [
    { nome: 'Temperatura',  tipo: 'Medir_Temperatura', icone: 'thermometer-outline'       },
    { nome: 'Cardíaco-SpO2',   tipo: 'Medir_Cardiaco',  icone: 'heart-half'              },
    { nome: 'Batimentos',   tipo: 'Medir_Batimentos',  icone: 'heart-half'                },
    { nome: 'Opção Gestos', tipo: 'Opcao_Gestos',      icone: 'arrow-redo-circle-outline' }
  ];

  gestos = [
    { nome: 'Abrir Mão',  tipo: 'abrir',   icone: 'hand-right-outline' },
    { nome: 'Fechar Mão', tipo: 'fechar',  icone: 'hand-right-outline' },
    { nome: 'Joinha',     tipo: 'joinha',  icone: 'thumbs-up-outline'  },
    { nome: 'Vezinho',    tipo: 'vezinho', icone: 'hand-right-outline' },
    { nome: 'Não',        tipo: 'nao',     icone: 'hand-right-outline' }
  ];

  constructor(
    private databaseService: DatabaseService,
    private bleService: BleService
  ) {
    addIcons({
      wifiOutline, bluetoothOutline, chevronForwardOutline,
      handRightOutline, thumbsUpOutline, thermometerOutline,
      leafOutline, heartHalf, arrowRedoCircleOutline
    });
  }

  async ionViewWillEnter() {
    const { value: ip } = await Preferences.get({ key: 'ip_esp32' });
    if (ip) this.ipEsp32 = ip;

    const { value: modo } = await Preferences.get({ key: 'modo_conexao' });
    if (modo === 'bluetooth' || modo === 'wifi') this.modoConexao = modo;
  }

  async onModoChange(event: any) {
    this.modoConexao = event.detail.value;
    await Preferences.set({ key: 'modo_conexao', value: this.modoConexao });
  }

  async enviarComando(tipo: string) {
    try {
      if (this.modoConexao === 'bluetooth') {
        if (!this.bleService.conectado) {
          alert('Bluetooth não conectado. Vá até a aba Conexão e conecte primeiro.');
          return;
        }
        await this.bleService.enviarComando(tipo);
      } else {
        const url = `http://${this.ipEsp32}/executar?tipo=${tipo}`;
        const response = await CapacitorHttp.get({ url, connectTimeout: 15000,
  readTimeout: 15000 });

        if (tipo.includes('Medir') && response.data) {
          await this.databaseService.adicionarMedicao({
            paciente_id: this.pacienteAtivoId,
            bpm:         response.data.bpm         || 0,
            spo2:        response.data.spo2        || 0,
            temperatura: response.data.temp || response.data.temperatura || 0
          });
        }
      }
    } catch (error: any) {
      alert('Erro ao enviar comando: ' + (error?.message ?? error));
    }
  }
}