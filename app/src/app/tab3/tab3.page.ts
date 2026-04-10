import { Component } from '@angular/core';
// Adicionei os ícones e componentes de lista/pesquisa necessários
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonButton, IonText,
  IonList, IonSearchbar, IonButtons, IonIcon, IonBadge,
  IonItemSliding, IonItemOptions, IonItemOption, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons'; // Importante para os ícones funcionarem
import { personAddOutline, trash, eyeOutline, arrowBackOutline, trashOutline } from 'ionicons/icons';

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
  
  // Controle de tela: 'lista', 'cadastro' ou 'detalhes'
  viewMode: 'lista' | 'cadastro' | 'detalhes' = 'lista';

  // Paciente sendo visualizado ou cadastrado no momento
  pacienteSelecionado: any = null;
  novoPaciente = { nome: '', cpf: '', dataNasc: '' };

  // Simulação de Banco de Dados
  pacientes = [
    { id: 1, nome: 'João da Silva', cpf: '123.456.789-00', dataNasc: '15/05/1980', oxigenio: '98%', batimentos: '75 bpm' },
    { id: 2, nome: 'Maria Oliveira', cpf: '987.654.321-11', dataNasc: '22/10/1992', oxigenio: '97%', batimentos: '80 bpm' }
  ];

  pacientesFiltrados = [...this.pacientes];

  constructor() {
    // Registra os ícones que vamos usar na interface
    addIcons({arrowBackOutline,trashOutline,personAddOutline,trash,eyeOutline});
  }

  // --- FUNÇÕES DE LÓGICA ---

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
      this.pacientes.push({ ...this.novoPaciente, id, oxigenio: '--', batimentos: '--' });
      this.pacientesFiltrados = [...this.pacientes];
      this.novoPaciente = { nome: '', cpf: '', dataNasc: '' }; // limpa form
      this.viewMode = 'lista';
    }
  }

  verDetalhes(paciente: any) {
    this.pacienteSelecionado = paciente;
    this.viewMode = 'detalhes';
  }

  deletarPaciente(paciente: any) {
    this.pacientes = this.pacientes.filter(p => p.id !== paciente.id);
    this.pacientesFiltrados = [...this.pacientes];
  }

  voltar() {
    this.viewMode = 'lista';
    this.pacienteSelecionado = null;
  }
}