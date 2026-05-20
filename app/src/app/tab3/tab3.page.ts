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
import { personAddOutline, trash, eyeOutline, arrowBackOutline, trashOutline, waterOutline, heartOutline, thermometerOutline, chevronBackOutline, chevronForwardOutline, downloadOutline } from 'ionicons/icons';
import { AlertController, ToastController } from '@ionic/angular';
import { Chart, registerables } from 'chart.js';
import { DatabaseService } from '../services/sqlite';
import { Database } from '../services/database';
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

  // Lista local para exibição
  pacientes: any[] = [];
  pacientesFiltrados: any[] = [];

  indiceMedicao = 0;

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private databaseService: DatabaseService,
    private database: Database
  ) {
    addIcons({
      arrowBackOutline, trashOutline, personAddOutline, waterOutline, 
      heartOutline, thermometerOutline, chevronBackOutline, 
      chevronForwardOutline, downloadOutline, trash, eyeOutline
    });
  }


  async carregarPacientes() {
    try {
      const dados = await this.databaseService.listarPacientes();
      this.pacientes = dados;
      this.pacientesFiltrados = [...this.pacientes];
    } catch (error) {
      console.error("Erro ao carregar pacientes do SQLite:", error);
    }
  }
async salvarNovoPaciente() {
  if (this.novoPaciente.nome && this.novoPaciente.cpf) {
    try {
      // Força a verificação da conexão antes de salvar
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
      console.error("Erro ao salvar paciente:", error);
    }
  }
}

  gerarGrafico() {
    if (this.chart) {
      this.chart.destroy();
    }

    // Nota: O acesso a 'medicoes' depende de como você estruturou o retorno no DatabaseService
    const dadosMedicao = this.pacienteSelecionado?.medicoes?.[this.indiceMedicao];
    
    this.chart = new Chart(this.lineChart.nativeElement, {
      type: 'line',
      data: {
        labels: ['-5s', '-4s', '-3s', '-2s', '-1s', 'Agora'],
        datasets: [{
          label: 'Batimentos (BPM)',
          data: dadosMedicao?.historico || [0, 0, 0, 0, 0, 0],
          borderColor: '#eb445a',
          backgroundColor: 'rgba(235, 68, 90, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: false, min: 40, max: 150 }
        }
      }
    });
  }

  async deletarMedicao(index: number) {
    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir esta medição?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          handler: () => {
            this.pacienteSelecionado.medicoes.splice(index, 1);
            if (this.indiceMedicao >= this.pacienteSelecionado.medicoes.length) { 
              this.indiceMedicao = Math.max(0, this.pacienteSelecionado.medicoes.length - 1);
            }
            this.gerarGrafico();
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
      const larguraPagina = pdf.internal.pageSize.getWidth();
      const margem = 15;
      let y = margem;

      pdf.setFillColor(0, 85, 255);
      pdf.rect(0, 0, larguraPagina, 22, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('Luy-83 — Relatório de Medição', margem, 14);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const dataGeracao = new Date().toLocaleString('pt-BR');
      pdf.text(`Emitido em ${dataGeracao}`, larguraPagina - margem, 14, { align: 'right' });

      y = 32;
      pdf.setTextColor(33, 33, 33);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Paciente', margem, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      y += 6;
      pdf.text(`Nome: ${paciente.nome || '—'}`, margem, y); y += 5;
      pdf.text(`CPF: ${paciente.cpf || '—'}`, margem, y); y += 5;
      pdf.text(`Data de nascimento: ${paciente.dataNasc || '—'}`, margem, y); y += 8;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Profissional Responsável', margem, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      y += 6;
      pdf.text(`Nome: ${profissional.nomeCompleto || '—'}`, margem, y); y += 5;
      const tipo = profissional.tipoProfissional === 'enfermeiro' ? 'Enfermeiro(a)' : 'Médico(a)';
      pdf.text(`Categoria: ${tipo}`, margem, y); y += 5;
      const registro = profissional.tipoProfissional === 'enfermeiro' ? 'COREN' : 'CRM';
      if (profissional.crm) {
        pdf.text(`${registro}: ${profissional.crm}${profissional.uf ? ' - ' + profissional.uf : ''}`, margem, y);
        y += 5;
      }
      if (profissional.especialidade) {
        pdf.text(`Especialidade: ${profissional.especialidade}`, margem, y);
        y += 5;
      }
      y += 3;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Dados da Medição', margem, y);
      y += 7;

      pdf.setDrawColor(220, 220, 220);
      pdf.setFillColor(245, 247, 252);
      pdf.rect(margem, y, larguraPagina - margem * 2, 38, 'FD');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const yBase = y + 6;
      pdf.text(`Data: ${medicao.data || '—'}${medicao.hora ? ' às ' + medicao.hora : ''}`, margem + 4, yBase);
      pdf.text(`Oximetria: ${medicao.oxigenio ?? '—'}`, margem + 4, yBase + 8);
      pdf.text(`Batimentos: ${medicao.batimentos ?? '—'}`, margem + 4, yBase + 16);
      pdf.text(`Temperatura: ${medicao.temperatura ?? '—'}`, margem + 4, yBase + 24);
      y += 44;

      if (this.chart) {
        try {
          const imgData = this.chart.toBase64Image();
          const larguraImg = larguraPagina - margem * 2;
          const alturaImg = 70;
          pdf.setFont('helvetica', 'bold');
          pdf.text('Histórico de Batimentos', margem, y);
          y += 4;
          pdf.addImage(imgData, 'PNG', margem, y, larguraImg, alturaImg);
          y += alturaImg + 6;
        } catch (e) {
          console.warn('Não foi possível anexar o gráfico ao PDF:', e);
        }
      }

      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text(
        'As medições realizadas pela mão robótica Luy-83 são informativas e devem ser confirmadas pelo profissional responsável.',
        margem, 285, { maxWidth: larguraPagina - margem * 2 }
      );

      const nomeArquivo = `medicao-${(paciente.nome || 'paciente').toString().replace(/\s+/g, '_')}-${(medicao.data || '').toString().replace(/\//g, '-')}.pdf`;
      pdf.save(nomeArquivo);

      const toast = await this.toastController.create({
        message: 'PDF gerado com sucesso.',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      const toast = await this.toastController.create({
        message: 'Erro ao gerar PDF.',
        duration: 2500,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    }
  }

  mudarPagina(direcao: number) {
    this.indiceMedicao += direcao;
    this.gerarGrafico();
  }

  buscar(event: any) {
    const termo = event.target.value.toLowerCase();
    this.pacientesFiltrados = this.pacientes.filter(p =>
      p.nome.toLowerCase().includes(termo) || p.cpf.includes(termo)
    );
  }

  abrirCadastro() {
    this.viewMode = 'cadastro';
  }

  verDetalhes(paciente: any) {
    this.pacienteSelecionado = paciente;
    this.viewMode = 'detalhes';
    this.indiceMedicao = 0;
    setTimeout(() => {
      this.gerarGrafico();
    }, 200);
  }

  async deletarPaciente(paciente: any) {
    // Aqui você deve adicionar um método no DatabaseService para deletar do SQLite também
    this.pacientes = this.pacientes.filter(p => p.id !== paciente.id);
    this.pacientesFiltrados = [...this.pacientes];
  }

  voltar() {
    this.viewMode = 'lista';
    this.pacienteSelecionado = null;
  }

  formatarCpf(event: any) {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.slice(0, 11);
    valor = valor.replace(/^(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    valor = valor.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    this.novoPaciente.cpf = valor;
  }
  async ionViewWillEnter() {
  // Garante que o banco está pronto antes de listar ou salvar
  await this.databaseService.iniciarBanco(); 
  await this.carregarPacientes();
}

  formatoData(event: any) {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 8) valor = valor.slice(0, 8);
    valor = valor.replace(/(\d{2})(\d)/, '$1/$2');
    valor = valor.replace(/(\d{2})(\d)/, '$1/$2');
    this.novoPaciente.dataNasc = valor; 
  }
}