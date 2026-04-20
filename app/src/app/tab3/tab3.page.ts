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
import { AlertController } from '@ionic/angular';
import { Chart, registerables } from 'chart.js';
import { DatabaseService } from '../services/sqlite';

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
    private databaseService: DatabaseService
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

  baixarPDF(medicao: any) {
    console.log('Baixando PDF:', medicao.data);
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