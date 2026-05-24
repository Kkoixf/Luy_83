import { Component, ViewChild, ElementRef } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonButton, IonText,
  IonList, IonSearchbar, IonButtons, IonIcon, IonBadge,
  IonItemSliding, IonItemOptions, IonItemOption, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  personAddOutline, trash, eyeOutline, arrowBackOutline,
  trashOutline, waterOutline, heartOutline, thermometerOutline,
  chevronBackOutline, chevronForwardOutline, downloadOutline,
  pulseOutline, medkitOutline
} from 'ionicons/icons';
import { AlertController, ToastController } from '@ionic/angular';
import { NavController } from '@ionic/angular/standalone';
import { Chart, registerables } from 'chart.js';
import { DatabaseService } from '../services/sqlite';
import { Database } from '../services/database';
import { MedicaoService } from '../services/medicao.service';
import jsPDF from 'jspdf';

Chart.register(...registerables);

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle,
    IonContent, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonText,
    IonList, IonSearchbar, IonButtons, IonIcon, IonBadge,
    IonItemSliding, IonItemOptions, IonItemOption, IonFab, IonFabButton
  ],
})
export class Tab3Page {
  @ViewChild('lineChart') lineChart!: ElementRef;
  chart: any;

  viewMode: 'lista' | 'cadastro' | 'detalhes' = 'lista';
  pacienteSelecionado: any = null;
  novoPaciente = { nome: '', cpf: '', dataNasc: '' };

  pacientes: any[] = [];
  pacientesFiltrados: any[] = [];
  indiceMedicao = 0;

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private databaseService: DatabaseService,
    private database: Database,
    private navController: NavController,
    private medicaoService: MedicaoService
  ) {
    addIcons({
      arrowBackOutline, trashOutline, personAddOutline, waterOutline,
      heartOutline, thermometerOutline, chevronBackOutline,
      chevronForwardOutline, downloadOutline, trash, eyeOutline,
      pulseOutline, medkitOutline
    });
  }

  async ionViewWillEnter() {
    await this.databaseService.iniciarBanco();
    await this.carregarPacientes();
  }

  async carregarPacientes() {
    try {
      const dados = await this.databaseService.listarPacientes();
      this.pacientes = dados;
      this.pacientesFiltrados = [...this.pacientes];

      if (this.viewMode === 'detalhes' && this.pacienteSelecionado) {
        await this.recarregarMedicoesPaciente();
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    }
  }

 
  private async recarregarMedicoesPaciente() {
    try {
      const registrosBrutos = await this.databaseService.buscarMedicoesPorPaciente(this.pacienteSelecionado.id);
      
     
      const medicoesMapeadas = registrosBrutos.map((reg: any) => {
       
        let dataFormatada = '—';
        let horaFormatada = '';
        if (reg.data_hora_registro) {
          const partes = reg.data_hora_registro.split(' ');
          if (partes[0]) {
            const d = partes[0].split('-');
            dataFormatada = `${d[2]}/${d[1]}/${d[0]}`; // DD/MM/YYYY
          }
          if (partes[1]) {
            horaFormatada = partes[1].substring(0, 5); // HH:MM
          }
        }

        return {
          id: reg.id,
          id_banco: reg.id,
          batimentos: reg.bpm,
          oxigenio: reg.spo2,
          temperatura: reg.temperatura,
          data: dataFormatada,
          hora: horaFormatada
        };
      }).reverse(); 

      this.pacienteSelecionado.medicoes = medicoesMapeadas;
     
      this.indiceMedicao = Math.max(0, medicoesMapeadas.length - 1);
      
      setTimeout(() => this.gerarGrafico(), 150);
    } catch (error) {
      console.error('Erro ao carregar medições do banco:', error);
    }
  }

  async salvarNovoPaciente() {
    if (!this.novoPaciente.nome || !this.novoPaciente.cpf) return;
    try {
      await this.databaseService.iniciarBanco();
      await this.databaseService.addPaciente(
        this.novoPaciente.nome,
        this.novoPaciente.cpf,
        this.novoPaciente.dataNasc
      );
      await this.carregarPacientes();
      this.novoPaciente = { nome: '', cpf: '', dataNasc: '' };
      this.viewMode = 'lista';
    } catch (error) {
      console.error('Erro ao salvar paciente:', error);
    }
  }

  gerarGrafico() {
    if (this.chart) { this.chart.destroy(); this.chart = null; }

    const medicoes: any[] = this.pacienteSelecionado?.medicoes ?? [];
    if (!medicoes.length || !this.lineChart?.nativeElement) return;

   
    const labels = medicoes.map((m: any, i: number) =>
      m.data ? (m.hora ? `${m.data} ${m.hora}` : m.data) : `#${i + 1}`
    );
    const bpmData = medicoes.map((m: any) => m.batimentos ?? null);
    
    
    const cores = bpmData.map((_: any, i: number) =>
      i === this.indiceMedicao ? '#e84c6a' : 'rgba(232,76,106,0.3)'
    );

    this.chart = new Chart(this.lineChart.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'BPM',
          data: bpmData,
          borderColor: '#e84c6a',
          backgroundColor: 'rgba(232,76,106,0.08)',
          pointBackgroundColor: cores,
          pointBorderColor: cores,
          pointRadius: bpmData.map((_: any, i: number) => i === this.indiceMedicao ? 7 : 4),
          fill: true,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 9 }, maxRotation: 30 } },
          y: { beginAtZero: false, min: 40, max: 180,
               title: { display: true, text: 'BPM', font: { size: 10 } } }
        }
      }
    });
  }

 
  async deletarMedicao(index: number) {
    const medicao = this.pacienteSelecionado.medicoes[index];
    if (!medicao) return;

    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: `Deseja excluir permanentemente a medição do dia ${medicao.data}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          handler: async () => {
            try {
   
              if (medicao.id_banco && (this.databaseService as any).db) {
                await (this.databaseService as any).db.run('DELETE FROM medicoes WHERE id = ?', [medicao.id_banco]);
              }
              
             
              this.pacienteSelecionado.medicoes.splice(index, 1);
              this.indiceMedicao = Math.max(0, Math.min(this.indiceMedicao, this.pacienteSelecionado.medicoes.length - 1));
              
              const t = await this.toastController.create({ message: 'Medição excluída.', duration: 2000, position: 'bottom' });
              await t.present();
              
              this.gerarGrafico();
            } catch (err) {
              console.error('Erro ao deletar medição do SQLite:', err);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async baixarPDF(medicao: any) {
    if (!medicao) return;
    try {
      const profissional = this.database.getUser() || {};
      const paciente = this.pacienteSelecionado || {};
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const lp = pdf.internal.pageSize.getWidth();
      const m = 15;
      let y = m;

      pdf.setFillColor(0, 85, 255);
      pdf.rect(0, 0, lp, 22, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('Luy-83 — Relatório de Medição', m, 14);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Emitido em ${new Date().toLocaleString('pt-BR')}`, lp - m, 14, { align: 'right' });

      y = 32;
      pdf.setTextColor(33, 33, 33);
      pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
      pdf.text('Paciente', m, y);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); y += 6;
      pdf.text(`Nome: ${paciente.nome || '—'}`, m, y); y += 5;
      pdf.text(`CPF: ${paciente.cpf || '—'}`, m, y); y += 5;
      pdf.text(`Nascimento: ${paciente.dataNasc || '—'}`, m, y); y += 8;

      pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
      pdf.text('Profissional Responsável', m, y);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); y += 6;
      pdf.text(`Nome: ${profissional.nomeCompleto || '—'}`, m, y); y += 5;
      const cat = profissional.tipoProfissional === 'enfermeiro' ? 'Enfermeiro(a)' : 'Médico(a)';
      pdf.text(`Categoria: ${cat}`, m, y); y += 5;
      const reg = profissional.tipoProfissional === 'enfermeiro' ? 'COREN' : 'CRM';
      if (profissional.crm) { pdf.text(`${reg}: ${profissional.crm}${profissional.uf ? ' - ' + profissional.uf : ''}`, m, y); y += 5; }
      if (profissional.especialidade) { pdf.text(`Especialidade: ${profissional.especialidade}`, m, y); y += 5; }
      y += 3;

      pdf.setFontSize(12); pdf.setFont('helvetica', 'bold');
      pdf.text('Dados da Medição', m, y); y += 7;
      pdf.setDrawColor(220, 220, 220); pdf.setFillColor(245, 247, 252);
      pdf.rect(m, y, lp - m * 2, 38, 'FD');
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
      const yb = y + 6;
      pdf.text(`Data: ${medicao.data || '—'}${medicao.hora ? ' às ' + medicao.hora : ''}`, m + 4, yb);
      pdf.text(`SpO2: ${medicao.oxigenio ?? '—'}%`, m + 4, yb + 8);
      pdf.text(`Batimentos: ${medicao.batimentos ?? '—'} BPM`, m + 4, yb + 16);
      pdf.text(`Temperatura: ${medicao.temperatura ?? '—'}°C`, m + 4, yb + 24);
      y += 44;

      if (this.chart) {
        try {
          const img = this.chart.toBase64Image();
          pdf.setFont('helvetica', 'bold');
          pdf.text('Histórico de Batimentos', m, y); y += 4;
          pdf.addImage(img, 'PNG', m, y, lp - m * 2, 70); y += 76;
        } catch (_) {}
      }

      pdf.setFontSize(8); pdf.setTextColor(120, 120, 120);
      pdf.text('As medições realizadas pela mão robótica Luy-83 são informativas e devem ser confirmadas pelo profissional responsável.',
        m, 285, { maxWidth: lp - m * 2 });

      pdf.save(`medicao-${(paciente.nome || 'paciente').replace(/\s+/g, '_')}-${(medicao.data || '').replace(/\//g, '-')}.pdf`);
      const t = await this.toastController.create({ message: 'PDF gerado.', duration: 2000, position: 'bottom' });
      await t.present();
    } catch (err) {
      console.error('Erro PDF:', err);
      const t = await this.toastController.create({ message: 'Erro ao gerar PDF.', duration: 2500, color: 'danger', position: 'bottom' });
      await t.present();
    }
  }

  mudarPagina(dir: number) {
    this.indiceMedicao += dir;
    this.gerarGrafico();
  }

  buscar(event: any) {
    const t = event.target.value.toLowerCase();
    this.pacientesFiltrados = this.pacientes.filter(p =>
      p.nome.toLowerCase().includes(t) || p.cpf.includes(t)
    );
  }

  abrirCadastro() { this.viewMode = 'cadastro'; }

  async verDetalhes(paciente: any) {
    this.pacienteSelecionado = { ...paciente, dataNasc: paciente.data_nascimento || paciente.dataNasc };
    this.viewMode = 'detalhes';
    await this.recarregarMedicoesPaciente();
  }

  async deletarPaciente(paciente: any) {
    const alert = await this.alertController.create({
      header: 'Excluir paciente',
      message: `Excluir ${paciente.nome}? Todas as medições serão removidas.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          handler: async () => {
            try { 
              await this.databaseService.deletarPaciente(paciente.id); 
            } catch (_) {}
            this.pacientes = this.pacientes.filter(p => p.id !== paciente.id);
            this.pacientesFiltrados = [...this.pacientes];
          }
        }
      ]
    });
    await alert.present();
  }

  voltar() {
    this.viewMode = 'lista';
    this.pacienteSelecionado = null;
    this.carregarPacientes();
  }

  iniciarTriagem() {
    if (!this.pacienteSelecionado) return;
    this.medicaoService.definirPaciente({
      id:        this.pacienteSelecionado.id,
      nome:      this.pacienteSelecionado.nome,
      cpf:       this.pacienteSelecionado.cpf,
      dataNasc:  this.pacienteSelecionado.dataNasc
    });
    this.navController.navigateForward('/tabs/tab2');
  }

  formatarCpf(event: any) {
    let v = event.target.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/^(\d{3})(\d)/, '$1.$2');
    v = v.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    v = v.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    this.novoPaciente.cpf = v;
  }

  formatoData(event: any) {
    let v = event.target.value.replace(/\D/g, '').slice(0, 8);
    v = v.replace(/(\d{2})(\d)/, '$1/$2');
    v = v.replace(/(\d{2})(\d)/, '$1/$2');
    this.novoPaciente.dataNasc = v;
  }
}