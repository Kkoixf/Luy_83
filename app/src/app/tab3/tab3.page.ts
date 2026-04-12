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

  pacientes = [
    { id: 1, 
      nome: 'Noah Still',
      cpf: '123.345.234-45',
      dataNasc: '12/09/1965',
      medicoes: [
        { id: 101, data: '11/04/2026', hora: '09:00', oxigenio: '98%', batimentos: '72 bpm', temperatura: '36.5°C', historico: [70, 72, 71, 73, 72, 75] },
        { id: 102, data: '11/04/2026', hora: '10:00', oxigenio: '96%', batimentos: '80 bpm', temperatura: '37.2°C', historico: [78, 80, 82, 79, 81, 80] }
      ]
    }
  ];

  indiceMedicao = 0;
  pacientesFiltrados = [...this.pacientes];

  constructor(private alertController: AlertController) {
    addIcons({arrowBackOutline,trashOutline,personAddOutline,waterOutline,heartOutline,thermometerOutline,chevronBackOutline,chevronForwardOutline,downloadOutline,trash,eyeOutline});
  }

  gerarGrafico() {
    if (this.chart) {
      this.chart.destroy();
    }

    const dadosMedicao = this.pacienteSelecionado?.medicoes[this.indiceMedicao];
    
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
      message: 'Tem certeza que deseja excluir está medição?',
      buttons:[
        { text: 'cancelar', role: 'cancel'},
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

  salvarNovoPaciente() {
    if(this.novoPaciente.nome && this.novoPaciente.cpf) {
      const id = this.pacientes.length + 1;
      const pacienteParaAdicionar = { 
        ...this.novoPaciente, 
        id, 
        medicoes: [] 
      };
      this.pacientes.push(pacienteParaAdicionar);
      this.pacientesFiltrados = [...this.pacientes];
      this.novoPaciente = { nome: '', cpf: '', dataNasc: '' }; 
      this.viewMode = 'lista';
    }
  }

  verDetalhes(paciente: any) {
    this.pacienteSelecionado = paciente;
    this.viewMode = 'detalhes';
    this.indiceMedicao = 0;
    setTimeout(() => {
      this.gerarGrafico();
    }, 200);
  }

  deletarPaciente(paciente: any) {
    this.pacientes = this.pacientes.filter(p => p.id !== paciente.id);
    this.pacientesFiltrados = [...this.pacientes];
  }

  voltar() {
    this.viewMode = 'lista';
    this.pacienteSelecionado = null;
  }
formatarCpf(event: any) {
 
  let valor = event.target.value.replace(/\D/g, '');
  if (valor.length > 11) {
    valor = valor.slice(0, 11);
  }
  valor = valor.replace(/^(\d{3})(\d)/, '$1.$2');
  valor = valor.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
  valor = valor.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  this.novoPaciente.cpf = valor;
  }

  formatoData(event: any) {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 8) {
      valor = valor.slice(0, 8);
    }

    valor = valor.replace(/(\d{2})(\d)/, '$1/$2');
    valor = valor.replace(/(\d{2})(\d)/, '$1/$2');
    this.novoPaciente.dataNasc = valor; 
  }
}