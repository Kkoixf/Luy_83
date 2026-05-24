import { Component } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonGrid, IonRow, IonCol, IonCard, IonCardContent,
  IonButton, IonIcon, IonText, IonList, IonItem, IonLabel,
  IonSegment, IonSegmentButton, IonSpinner,
  IonButtons, IonCardHeader, IonBadge
} from '@ionic/angular/standalone';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Preferences } from '@capacitor/preferences';
import { addIcons } from 'ionicons';
import {
  handRightOutline, thumbsUpOutline, thermometerOutline,
  leafOutline, heartHalf, arrowRedoCircleOutline, wifiOutline,
  bluetoothOutline, chevronForwardOutline, personOutline, warningOutline, 
  heartOutline, waterOutline, checkmarkOutline, closeOutline 
} from 'ionicons/icons';
import { DatabaseService } from '../services/sqlite';
import { CapacitorHttp } from '@capacitor/core';
import { BleService } from '../services/Ble.service';
import { MedicaoService, ResultadoMedicao } from '../services/medicao.service';
import { AlertController } from '@ionic/angular/standalone';

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
    IonButtons, IonCardHeader, IonBadge,
    CommonModule, FormsModule, AsyncPipe
  ],
})
export class Tab2Page {

  modoConexao: 'wifi' | 'bluetooth' = 'wifi';
  ipEsp32 = '192.168.0.23';
  
  pacienteAtivo$ = this.medicaoService.paciente$;

  resultadoMedicao: ResultadoMedicao | null = null;

  medicaoIniciada = false;
  statusMedicao = '';
  diagnostico = '';

  bleConectado$  = this.bleService.conectado$;
  bleStatus$     = this.bleService.statusMsg$;
  bleConectando$ = this.bleService.conectando$;

  sensores = [
    { nome: 'Temperatura',   tipo: 'Medir_Temperatura', icone: 'thermometer-outline', requerPaciente: true },
    { nome: 'Cardíaco-SpO2',   tipo: 'Medir_Cardiaco',    icone: 'heart-half',         requerPaciente: true },
  ];

  gestos = [
    { nome: 'Abrir Mão',   tipo: 'abrir',   icone: 'hand-right-outline' },
    { nome: 'Fechar Mão',  tipo: 'fechar',  icone: 'hand-right-outline' },
    { nome: 'Joinha',      tipo: 'joinha',  icone: 'thumbs-up-outline'  },
    { nome: 'Vezinho',     tipo: 'vezinho', icone: 'hand-right-outline' },
    { nome: 'Não',         tipo: 'nao',     icone: 'hand-right-outline' }
  ];

  constructor(
    private databaseService: DatabaseService,
    private bleService: BleService,
    private medicaoService: MedicaoService,
    private alertController: AlertController
  ) {
    addIcons({
      personOutline, warningOutline, wifiOutline, bluetoothOutline, heartOutline, 
      waterOutline, thermometerOutline, checkmarkOutline, closeOutline, chevronForwardOutline, 
      handRightOutline, thumbsUpOutline, leafOutline, heartHalf, arrowRedoCircleOutline
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



  async limparPaciente() {
    this.medicaoService.limpar();
    this.resultadoMedicao = null; 
    this.medicaoService.apagaPacienteControle();
    
  }

  async enviarComando(tipo: string) {
    const requerPaciente = this.sensores.find(s => s.tipo === tipo)?.requerPaciente ?? false;
    
    if (requerPaciente && !this.medicaoService.pacienteAtivo) {
      const a = await this.alertController.create({
        header: 'Paciente não selecionado',
        message: 'Entre na aba Pacientes, abra o perfil do paciente escolhido e toque em "iniciar triagem".',
        buttons: ['OK']
      });
      await a.present();
      return;
    }  

    if (requerPaciente && this.medicaoIniciada) return;

  
    this.diagnostico = '';

    try {
      if (this.modoConexao === 'bluetooth') {
        if (!this.bleService.conectado) {
          alert('Bluetooth não conectado. Vá até a aba Conexão e conecte primeiro.');
          return;
        }
        await this.bleService.enviarComando(tipo);
        this.log(`BLE: "${tipo}" enviado`);
        
        if (tipo.includes('Medir')) {
          this.medicaoIniciada = true;
          this.statusMedicao = tipo === 'Medir_Temperatura' ? 'Medindo temperatura' : 'Medindo batimentos e SpO2';
          await this.aguardarResultado(tipo);
        }
      } else {
        // Fluxo de conexão WI-FI (CapacitorHttp)
        this.medicaoIniciada = true;
        this.statusMedicao = tipo === 'Medir_Cardiaco' ? 'Medindo batimentos e SpO2' : 'Medindo temperatura';

        const url = `http://${this.ipEsp32}/executar?tipo=${tipo}`;
        this.log(`[1/3] Disparando ${tipo}…`);
        
        try {
          const resp = await CapacitorHttp.get({ url, connectTimeout: 8000, readTimeout: 8000 });
          this.log(`[2/3] ESP respondeu: HTTP ${resp.status}`);
        } catch (e: any) {
          this.log(`[2/3] Timeout no /executar — continuando polling mesmo assim`);
        }

        this.log(`[3/3] Polling iniciado…`);
        await this.aguardarResultado(tipo);
      }
    } catch (error: any) {
      this.medicaoIniciada = false;
      this.statusMedicao = '';
      this.log(`ERRO: ${error?.message ?? error}`);
      const a = await this.alertController.create({
        header: 'Erro', 
        message: error?.message ?? String(error), 
        buttons: ['OK']
      });
      await a.present();
    }
  }

  private async aguardarResultado(tipo: string) {
    const endpoint = tipo === 'Medir_Temperatura'
      ? `http://${this.ipEsp32}/temperatura`
      : `http://${this.ipEsp32}/cardiaco`;

    const INTERVALO = 2000;
    const MAX = 25;

    for (let i = 0; i < MAX; i++) {
      await this.delay(INTERVALO);
      this.statusMedicao = `Aguardando… (${i + 1}/${MAX})`;

      try {
        const resp = await CapacitorHttp.get({ url: endpoint, connectTimeout: 4000, readTimeout: 4000 });
        this.log(`Poll ${i + 1}: HTTP ${resp.status} → ${JSON.stringify(resp.data)}`);

        if (resp.status === 202) continue;

        if (resp.status === 200 && resp.data) {
          
          
          const dadosAtuais = this.resultadoMedicao ? { ...this.resultadoMedicao } : { bpm: 0, spo2: 0, temperatura: 0 };

          if (tipo === 'Medir_Temperatura') {
            dadosAtuais.temperatura = resp.data.temp ?? resp.data.temperatura ?? 0;
          } else if (tipo === 'Medir_Cardiaco') {
            dadosAtuais.bpm = resp.data.bpm ?? 0;
            dadosAtuais.spo2 = resp.data.spo2 ?? 0;
          }

          this.resultadoMedicao = dadosAtuais;
          this.medicaoIniciada = false;
          this.statusMedicao = '';
          this.log(`Leitura parcial/completa integrada: ${JSON.stringify(this.resultadoMedicao)}`);
          return;
        }

        this.medicaoIniciada = false;
        this.statusMedicao = '';
        const msg = resp.data?.erro === 'sensor'
          ? 'Erro no sensor. Verifique o posicionamento e tente novamente.'
          : `Erro inesperado (HTTP ${resp.status})`;
        this.log(`ERRO: ${msg}`);
        const a = await this.alertController.create({ header: 'Erro na medição', message: msg, buttons: ['OK'] });
        await a.present();
        return;

      } catch (e: any) {
        this.log(`Poll ${i + 1}: falha de rede — ${e?.message ?? e}`);
      }
    }

    this.medicaoIniciada = false;
    this.statusMedicao = '';
    this.log('TIMEOUT: ESP32 não respondeu.');
    const a = await this.alertController.create({
      header: 'Tempo esgotado',
      message: 'O ESP32 não respondeu a tempo. Verifique a conexão Wi-Fi e tente novamente.',
      buttons: ['OK']
    });
    await a.present();
  }

  async salvarMedicao() {
    const paciente = this.medicaoService.pacienteAtivo;
    const resultado = this.resultadoMedicao;
    if (!paciente || !resultado) return;

    try {
      
      await this.databaseService.adicionarMedicao({
        paciente_id: paciente.id,
        bpm:         resultado.bpm,
        spo2:        resultado.spo2,
        temperatura: resultado.temperatura
      });

      this.resultadoMedicao = null;
      this.diagnostico = '';
      this.medicaoService.limpar();

      const t = await this.alertController.create({
        header: '✓ Salvo',
        message: `Medição completa vinculada a ${paciente.nome}.`,
        buttons: ['OK']
      });
      await t.present();
    } catch (err: any) {
      const a = await this.alertController.create({
        header: 'Erro ao salvar', message: err?.message ?? String(err), buttons: ['OK']
      });
      await a.present();
    }
  }

  async descartar() {
    const a = await this.alertController.create({
      header: 'Descartar leitura?',
      message: 'Os dados medidos serão perdidos.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Descartar',
          handler: () => {
            this.resultadoMedicao = null;
            this.diagnostico = '';
          }
        }
      ]
    });
    await a.present();
  }

  private log(msg: string) {
    const h = new Date().toLocaleTimeString('pt-BR');
    this.diagnostico += `[${h}] ${msg}\n`;
    console.log('[Luy83]', msg);
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}