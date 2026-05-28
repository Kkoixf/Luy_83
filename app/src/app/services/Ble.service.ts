import { Injectable } from '@angular/core';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { BehaviorSubject, Subject } from 'rxjs';

const SERVICE_UUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const CHAR_UUID_RX = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
// ===== ADICIONADO: UUID da característica de Transmissão (TX) do ESP32 =====
const CHAR_UUID_TX = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'; 

@Injectable({ providedIn: 'root' })
export class BleService {

  private deviceId: string | null = null;

  // Observáveis para as abas reagirem à mudança de estado
  conectado$ = new BehaviorSubject<boolean>(false);
  statusMsg$ = new BehaviorSubject<string>('Desconectado');
  conectando$ = new BehaviorSubject<boolean>(false);
  
  
  dadosRecebidos$ = new Subject<string>();

  constructor() {
    BleClient.initialize().catch(e => console.error('BLE init', e));
  }

  get conectado(): boolean {
    return this.conectado$.value;
  }

  async conectar(): Promise<void> {
    try {
      this.conectando$.next(true);
      this.statusMsg$.next('Procurando...');

      const device = await BleClient.requestDevice({
        name: 'Luy83_Mao_Robotica',
        optionalServices: [SERVICE_UUID]
      });

      this.deviceId = device.deviceId;
      this.statusMsg$.next('Conectando...');

      await BleClient.connect(this.deviceId, () => {
        // Desconexão inesperada
        this.limparConexao();
        this.statusMsg$.next('Desconectado (perdeu sinal)');
      });

      
      await this.iniciarEscutaNotificacoes();

      this.conectado$.next(true);
      this.statusMsg$.next(`Conectado: ${device.name ?? device.deviceId}`);
      console.log('BLE conectado:', this.deviceId);

    } catch (error: any) {
      this.limparConexao();
      this.statusMsg$.next('Falha ao conectar');
      throw error;
    } finally {
      this.conectando$.next(false);
    }
  }

  async desconectar(): Promise<void> {
    if (this.deviceId) {
      try { 
      
        await BleClient.stopNotifications(this.deviceId, SERVICE_UUID, CHAR_UUID_TX);
        await BleClient.disconnect(this.deviceId); 
      } catch (_) {}
    }
    this.limparConexao();
    this.statusMsg$.next('Desconectado');
  }


  private async iniciarEscutaNotificacoes(): Promise<void> {
    if (!this.deviceId) return;

    await BleClient.startNotifications(
      this.deviceId,
      SERVICE_UUID,
      CHAR_UUID_TX,
      (value: DataView) => {
        // Converte os bytes recebidos de volta para Texto (String)
        const decoder = new TextDecoder('utf-8');
        const textoRecebido = decoder.decode(value.buffer).trim();
        console.log('BLE Recebido do ESP32:', textoRecebido);
        
     
        this.dadosRecebidos$.next(textoRecebido);
      }
    );
  }

  private limparConexao() {
    this.deviceId = null;
    this.conectado$.next(false);
  }

  async enviarComando(tipo: string): Promise<void> {
    if (!this.conectado || !this.deviceId) {
      throw new Error('Bluetooth não conectado.');
    }
    const payload = `CMD:${tipo}`;
    const data = new TextEncoder().encode(payload);
    await BleClient.write(
      this.deviceId,
      SERVICE_UUID,
      CHAR_UUID_RX,
      new DataView(data.buffer)
    );
    console.log('BLE enviado:', payload);
  }

  async enviarRaw(payload: string): Promise<void> {
    if (!this.conectado || !this.deviceId) {
      throw new Error('Bluetooth não conectado.');
    }
    const data = new TextEncoder().encode(payload);
    await BleClient.write(
      this.deviceId,
      SERVICE_UUID,
      CHAR_UUID_RX,
      new DataView(data.buffer)
    );
  }
}