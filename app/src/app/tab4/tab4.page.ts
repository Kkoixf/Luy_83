import { Component, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonGrid, IonRow, IonCol, IonCard, IonCardContent,
  IonItem, IonLabel, IonInput, IonButton, IonIcon,
  IonText, IonSpinner, IonList, IonCardHeader, IonCardTitle
} from '@ionic/angular/standalone';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Preferences } from '@capacitor/preferences';
import {
  settingsOutline, bluetoothOutline, wifiOutline,
  lockClosedOutline, globeOutline, saveOutline
} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { CapacitorHttp, HttpResponse } from '@capacitor/core'; // Para comandos via Wi-Fi

@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonGrid, IonRow, IonCol, IonCard, IonCardContent,
    IonItem, IonLabel, IonInput, IonButton, IonIcon,
    IonText, IonSpinner, IonList, IonCardHeader, IonCardTitle,
    CommonModule, FormsModule
  ],
})
export class Tab4Page implements OnInit {

  ipEsp32 = "192.168.0.23";
  wifiSSID = "";
  wifiPASS = "";
  isConfiguring = false;
  statusConfig = "";

  constructor(
    private androidPermissions: AndroidPermissions
  ) {
    addIcons({
      wifiOutline,
      lockClosedOutline,
      bluetoothOutline,
      globeOutline,
      saveOutline,
      settingsOutline
    });
  }

  async ngOnInit() {
    const { value } = await Preferences.get({ key: 'ip_esp32' });
    if (value) this.ipEsp32 = value;

    try {
      await BleClient.initialize();
    } catch (e) {
      console.error("Erro ao iniciar Bluetooth", e);
    }
  }


  async pedirPermissoesBLE() {
    await this.androidPermissions.requestPermissions([
      this.androidPermissions.PERMISSION.BLUETOOTH_SCAN,
      this.androidPermissions.PERMISSION.BLUETOOTH_CONNECT,
      this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION
    ]);
  }


  async configurarNovaMao() {
    let deviceId = "";
    try {
      this.isConfiguring = true;
      this.statusConfig = "Procurando Mão Robótica...";


      const device = await BleClient.requestDevice({
        name: 'MaoRobotica_Config',
        optionalServices: ["6E400001-B5A3-F393-E0A9-E50E24DCCA9E"]
      });

      deviceId = device.deviceId;
      this.statusConfig = "Conectando...";
      await BleClient.connect(deviceId);

      this.statusConfig = "Enviando dados do Wi-Fi...";

      // Prepara o texto para enviar (SSID e Senha)
      const payload = `SSID:${this.wifiSSID};PASS:${this.wifiPASS}`;
      const data = new TextEncoder().encode(payload);


      await BleClient.write(
        deviceId,
        "6E400001-B5A3-F393-E0A9-E50E24DCCA9E",
        "6E400002-B5A3-F393-E0A9-E50E24DCCA9E",
        new DataView(data.buffer)
      );

      alert("Configuração enviada com sucesso!");

    } catch (error) {
      console.error(error);
      alert("Erro na configuração: " + error);
    } finally {
      this.isConfiguring = false;
      if (deviceId) {
        await BleClient.disconnect(deviceId);
      }
    }
  }


  async enviarComando(tipoGesto: string) {
    const host = this.ipEsp32.trim().replace('http://', '').replace('/', '');
    const url = `http://${host}/executar?tipo=${tipoGesto}`;

    try {
      const options = { url: url };
      const response: HttpResponse = await CapacitorHttp.get(options);
      console.log("Comando enviado:", response.status);
    } catch (err) {
      alert("Erro: Mão não respondeu no Wi-Fi.");
    }
  }

  // Deseparelhar Wifi
async desparelhar() {
  const host = this.ipEsp32.trim().replace('http://', '').replace('/', '');
  const url = `http://${host}/reset_wifi`; // Rota que você deve criar no ESP32

  try {
    const response = await CapacitorHttp.get({ url });
    if (response.status === 200) {
      alert("Comando enviado! O ESP32 irá apagar a rede e reiniciar.");
      // Opcional: Limpar o IP salvo no app
      this.ipEsp32 = "";
      await Preferences.remove({ key: 'ip_esp32' });
    }
  } catch (err) {
    alert("Erro ao tentar desparelhar. Verifique a conexão.");
  }
}

  async salvarIP() {
    try {
      await Preferences.set({
        key: 'ip_esp32',
        value: this.ipEsp32
      });
      alert('Endereço IP salvo! Vá até a tela Controle para controlar a medição.');
    } catch (error) {
      console.error("Erro ao salvar IP:", error);
    }
  }
}
