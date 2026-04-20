import { Component } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonGrid, IonRow, IonCol, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonList, IonItem, IonLabel
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Preferences } from '@capacitor/preferences'; 
import { addIcons } from 'ionicons';
import { 
  handRightOutline, thumbsUpOutline, thermometerOutline, 
  leafOutline, heartHalf, arrowRedoCircleOutline, wifiOutline, 
  lockClosedOutline, bluetoothOutline, globeOutline, saveOutline, 
  chevronForwardOutline 
} from 'ionicons/icons';
import { DatabaseService } from '../services/sqlite';
import { CapacitorHttp } from '@capacitor/core';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, 
    IonGrid, IonRow, IonCol, IonCard, IonCardContent,
    IonButton, IonIcon, IonText, IonList, IonItem, IonLabel,
    CommonModule
  ],   
})
export class Tab2Page {
  ipEsp32 = "192.168.0.23"; 
  pacienteAtivoId = 1; 

  sensores = [
    { nome: 'Temperatura', tipo: 'Medir_Temperatura', icone: 'thermometer-outline'},
    { nome: 'Oxigenação', tipo: 'Medir_Oxigenacao', icone: 'leaf-outline' },
    { nome: 'Batimentos', tipo: 'Medir_Batimentos', icone: 'heart-half' },
    { nome: 'Opção Gestos', tipo: 'Opcao_Gestos', icone: 'arrow-redo-circle-outline' }
  ];

  gestos = [
    { nome: 'Abrir Mão', tipo: 'abrir', icone: 'hand-right-outline' },
    { nome: 'Fechar Mão', tipo: 'fechar', icone: 'hand-right-outline' },
    { nome: 'Joinha', tipo: 'joinha', icone: 'thumbs-up-outline' },
    { nome: 'Vezinho', tipo: 'vezinho', icone: 'hand-right-outline' },
    { nome: 'Não', tipo: 'nao', icone: 'hand-right-outline' }
  ];

  constructor(private databaseService: DatabaseService) {
    addIcons({
      wifiOutline, lockClosedOutline, bluetoothOutline, globeOutline, 
      saveOutline, chevronForwardOutline, handRightOutline, thumbsUpOutline, 
      thermometerOutline, leafOutline, heartHalf, arrowRedoCircleOutline
    });
  }

  async ionViewWillEnter() {
    const { value } = await Preferences.get({ key: 'ip_esp32' });
    if (value) {
      this.ipEsp32 = value;
    }
  }

  async enviarComando(tipoGesto: string) {
    // Corrigido: usa this.ipEsp32 em vez de host
    const url = `http://${this.ipEsp32}/executar?tipo=${tipoGesto}`;
    
    try {
      const response = await CapacitorHttp.get({ url });
      
      
      if (tipoGesto.includes('Medir') && response.data) {
        await this.databaseService.adicionarMedicao({
          paciente_id: this.pacienteAtivoId, 
          bpm: response.data.bpm || 0,
          spo2: response.data.spo2 || 0,
          temperatura: response.data.temp || response.data.temperatura || 0
        });
        console.log('Medição salva com sucesso!');
      }
    } catch (error) {
      console.error("Erro ao enviar comando ou salvar medição", error);
    }
  }
} 