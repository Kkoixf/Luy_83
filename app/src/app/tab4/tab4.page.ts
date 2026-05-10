import { Component, OnInit } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonItem, IonLabel, IonInput, IonButton, IonIcon,
  IonText, IonSpinner, IonBadge
} from '@ionic/angular/standalone';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Preferences } from '@capacitor/preferences';
import { addIcons } from 'ionicons';
import {
  bluetoothOutline, wifiOutline, lockClosedOutline,
  globeOutline, saveOutline, eyeOffOutline, eyeOutline
} from 'ionicons/icons';
import { linkOutline, unlinkOutline, refreshOutline } from 'ionicons/icons';
import { CapacitorHttp } from '@capacitor/core';
import { BleService } from '../services/Ble.service';

@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle,
    IonItem, IonLabel, IonInput, IonButton, IonIcon,
    IonText, IonSpinner, IonBadge,
    CommonModule, FormsModule, AsyncPipe
  ],
})
export class Tab4Page implements OnInit {

  // ── Wi-Fi ────────────────────────────────────────────────────────────────────
  ipEsp32 = 'maorobotica.local';
  wifiSSID = '';
  wifiPASS = '';
  showPassword = false;
  isConfiguring = false;
  statusConfig = '';

  // ── BLE (expõe os observáveis do serviço direto no template) ─────────────────
  bleConectado$  = this.bleService.conectado$;
  bleStatus$     = this.bleService.statusMsg$;
  bleConectando$ = this.bleService.conectando$;

  constructor(private bleService: BleService) {
    addIcons({
      bluetoothOutline, wifiOutline, lockClosedOutline,
      globeOutline, saveOutline, eyeOffOutline, eyeOutline,
      linkOutline, unlinkOutline, refreshOutline
    });
  }

  async ngOnInit() {
    const { value } = await Preferences.get({ key: 'ip_esp32' });
    if (value) this.ipEsp32 = value;
  }

  // ── Toggle senha ─────────────────────────────────────────────────────────────
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // ── BLE: Conectar / Desconectar ──────────────────────────────────────────────
  async conectarBLE() {
    try {
      await this.bleService.conectar();
    } catch (error: any) {
      alert('Erro ao conectar: ' + (error?.message ?? error));
    }
  }

  async desconectarBLE() {
    await this.bleService.desconectar();
  }

 
  async configurarWifi() {
    if (!this.wifiSSID.trim()) {
      alert('Preencha o nome da rede (SSID).');
      return;
    }

    this.isConfiguring = true;
    this.statusConfig = 'Enviando...';

    try {
      // Garante que o BLE está conectado
      if (!this.bleService.conectado) {
        this.statusConfig = 'Procurando Luy...';
        await this.bleService.conectar();
      }

      const payload = `SSID:${this.wifiSSID};PASS:${this.wifiPASS}`;
      await this.bleService.enviarRaw(payload);

      alert('Configuração Wi-Fi enviada! Aguarde o Luy conectar à rede.');

    } catch (error: any) {
      alert('Erro: ' + (error?.message ?? error));
    } finally {
      this.isConfiguring = false;
      this.statusConfig = '';
    }
  }

  // ── Resetar Wi-Fi do ESP32 ───────────────────────────────────────────────────
  async resetarWifi() {
    const host = this.ipEsp32.trim().replace('http://', '').replace('/', '');
    const url = `http://${host}/reset_wifi`;
    try {
      const response = await CapacitorHttp.get({ url });
      if (response.status === 200) {
        alert('Comando enviado! O Luy irá apagar a rede e reiniciar.');
        this.ipEsp32 = '';
        await Preferences.remove({ key: 'ip_esp32' });
      }
    } catch {
      alert('Erro ao resetar. Verifique a conexão Wi-Fi.');
    }
  }

  // ── Salvar IP / mDNS ─────────────────────────────────────────────────────────
  async salvarIP() {
    await Preferences.set({ key: 'ip_esp32', value: this.ipEsp32 });
    alert('Endereço salvo! Use a aba Controle para enviar comandos.');
  }
}