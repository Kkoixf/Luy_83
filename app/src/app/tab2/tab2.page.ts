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


import { CapacitorHttp, HttpResponse } from '@capacitor/core';

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

  
  async ionViewWillEnter() {
    const { value } = await Preferences.get({ key: 'ip_esp32' });
    if (value) {
      this.ipEsp32 = value;
    }
  }
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

  constructor() {
    addIcons({
      wifiOutline, lockClosedOutline, bluetoothOutline, globeOutline, 
      saveOutline, chevronForwardOutline, handRightOutline, thumbsUpOutline, 
      thermometerOutline, leafOutline, heartHalf, arrowRedoCircleOutline
    });
  }

  async enviarComando(tipoGesto: string) {
    let host = this.ipEsp32.trim().replace('http://', '').replace('/', '');
    const url = `http://${host}/executar?tipo=${tipoGesto}`;
    
    try {
      
      const options = { url: url };
      const response: HttpResponse = await CapacitorHttp.get(options);
      console.log("Resposta da mão:", response.status);
    } catch (error) {
      alert("Erro de conexão. Verifique o Wi-Fi.");
    }
  }
}