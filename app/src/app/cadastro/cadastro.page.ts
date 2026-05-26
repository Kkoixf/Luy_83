import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem,
  IonInput, IonCard, IonCardTitle, IonCardHeader, IonCardContent,
  IonLabel, IonBackButton, IonButtons, IonSelect, IonSelectOption, IonCheckbox, IonNote
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';
import { NotificationService } from '../services/notification.service';
import { Auth, createUserWithEmailAndPassword, authState } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Database } from '../services/database';
import { addIcons } from 'ionicons';
import { chevronDownOutline, chevronForwardOutline, checkmarkOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem,
    IonInput, CommonModule, FormsModule, IonCard, IonCardTitle,
    IonCardHeader, IonCardContent, IonLabel, IonBackButton,
    IonButtons, IonSelect, IonSelectOption, IonCheckbox, IonNote
  ]
})
export class CadastroPage implements OnInit {

  newPassword = '';
  confirmPassword = '';
  googleFlow = false;
  isLoading = false;

  dados = {
    nomeCompleto: '',
    genero: '',
    telefone: '',
    tipoProfissional: 'medico',
    crm: '',
    uf: '',
    cpf: '',
    especialidade: '',
    email: '',
    termsAccepted: false
  };

  estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  especialidadesMedicas = [
    'Alergologia', 'Anestesiologia', 'Angiologia', 'Cardiologia',
    'Cirurgia Geral', 'Cirurgia Plástica', 'Cirurgia Vascular',
    'Clínica Médica', 'Dermatologia', 'Endocrinologia',
    'Gastroenterologia', 'Geriatria', 'Ginecologia e Obstetrícia',
    'Hematologia', 'Infectologia', 'Mastologia', 'Medicina de Família',
    'Medicina do Trabalho', 'Medicina Esportiva', 'Medicina Intensiva',
    'Nefrologia', 'Neurocirurgia', 'Neurologia', 'Nutrologia',
    'Oftalmologia', 'Oncologia', 'Ortopedia e Traumatologia',
    'Otorrinolaringologia', 'Patologia', 'Pediatria', 'Pneumologia',
    'Psiquiatria', 'Radiologia', 'Reumatologia', 'Urologia', 'Outra'
  ];

  constructor(
    private router: Router,
    private notify: NotificationService,
    private alertController: AlertController,
    private auth: Auth,
    private firestore: Firestore,
    private database: Database,
    private ngZone: NgZone,
  ) {
    addIcons({ chevronDownOutline, chevronForwardOutline, checkmarkOutline });
  }

  ngOnInit() {
    // Aguarda o authState resolver (em APK o currentUser pode ainda ser null no init)
    firstValueFrom(authState(this.auth).pipe(filter(u => u !== undefined)))
      .then(user => {
        this.ngZone.run(() => {
          if (user) {
            this.googleFlow = true;
            this.dados.email = user.email || '';
            this.dados.nomeCompleto = user.displayName || '';
          }
        });
      })
      .catch(() => { /* silencioso */ });
  }

  async register() {
    if (this.isLoading) return;

    if (!this.dados.termsAccepted) {
      this.notify.warning('Você precisa aceitar os termos de uso.');
      return;
    }

    if (!this.dados.nomeCompleto.trim()) {
      this.notify.warning('Preencha o nome completo.');
      return;
    }

    const email = (this.dados.email || '').trim().toLowerCase();
    if (!email) {
      this.notify.warning('Preencha o e-mail.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.notify.warning('E-mail inválido.');
      return;
    }

    if (!this.dados.cpf || this.dados.cpf.replace(/\D/g, '').length !== 11) {
      this.notify.warning('CPF inválido.');
      return;
    }

    if (!this.dados.telefone || this.dados.telefone.replace(/\D/g, '').length < 10) {
      this.notify.warning('Telefone inválido.');
      return;
    }

    if (!this.dados.genero) {
      this.notify.warning('Selecione o gênero.');
      return;
    }

    if (!this.dados.tipoProfissional) {
      this.notify.warning('Selecione o tipo de profissional.');
      return;
    }

    if (this.dados.tipoProfissional === 'medico' && !this.dados.especialidade) {
      this.notify.warning('Selecione a especialidade médica.');
      return;
    }

    if (!this.dados.crm) {
      const campo = this.dados.tipoProfissional === 'enfermeiro' ? 'COREN' : 'CRM';
      this.notify.warning(`Informe o número do ${campo}.`);
      return;
    }

    if (!this.dados.uf) {
      this.notify.warning('Selecione a UF.');
      return;
    }

    this.isLoading = true;

    try {
      let uid: string;

      if (this.googleFlow) {
        if (!this.auth.currentUser) {
          this.notify.error('Sessão do Google expirou. Faça login novamente.');
          this.ngZone.run(() => this.router.navigate(['/login'], { replaceUrl: true }));
          return;
        }
        uid = this.auth.currentUser.uid;
      } else {
        if (!this.newPassword || this.newPassword !== this.confirmPassword) {
          this.notify.warning('As senhas não coincidem.');
          return;
        }

        if (!this.senhaForte(this.newPassword)) {
          this.notify.warning('Senha fraca. Use 8+ caracteres com maiúscula, minúscula, número e caractere especial.');
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          this.auth,
          email,
          this.newPassword
        );
        uid = userCredential.user.uid;
      }

      const dadosParaSalvar = {
        nomeCompleto: this.dados.nomeCompleto.trim(),
        genero: this.dados.genero,
        telefone: this.dados.telefone,
        tipoProfissional: this.dados.tipoProfissional,
        crm: this.dados.crm,
        uf: this.dados.uf,
        cpf: this.dados.cpf,
        especialidade: this.dados.especialidade,
        email,
        projeto: 'Luy-83',
        dataCriacao: new Date().toISOString(),
        provider: this.googleFlow ? 'google' : 'email',
        uid,
        firstLogin: true
      };

      await setDoc(doc(this.firestore, 'usuarios', uid), dadosParaSalvar);

      this.database.setUser(dadosParaSalvar);

      await this.notify.success('Cadastro realizado com sucesso!');

      this.ngZone.run(() => {
        this.router.navigate(['/tabs/tab1'], { replaceUrl: true });
      });

    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      const code = error?.code || '';
      let mensagem = 'Erro ao cadastrar. Tente novamente.';
      if (code === 'auth/email-already-in-use') mensagem = 'Este e-mail já está em uso.';
      else if (code === 'auth/weak-password') mensagem = 'Senha muito fraca.';
      else if (code === 'auth/invalid-email') mensagem = 'E-mail inválido.';
      else if (code === 'auth/network-request-failed') mensagem = 'Sem conexão com a internet.';
      else if (code === 'permission-denied') mensagem = 'Sem permissão para salvar. Tente novamente.';
      this.notify.error(mensagem);
    } finally {
      this.isLoading = false;
    }
  }

  async mostrarTermos() {
    const alert = await this.alertController.create({
      header: 'Termos de Uso',
      message: 'Este aplicativo é uma ferramenta de auxílio à triagem remota. As medições realizadas pela mão robótica Luy-83 devem ser conferidas pelo profissional responsável. O uso deste sistema implica na aceitação dos termos de privacidade e proteção de dados (LGPD).',
      buttons: ['Entendi']
    });
    await alert.present();
  }

  async trocarConta() {
    const { signOut } = await import('@angular/fire/auth');
    await signOut(this.auth);
    this.googleFlow = false;
    this.dados.email = '';
    this.dados.nomeCompleto = '';
    this.notify.info('Sessão encerrada.');
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  formatarCpf(event: any) {
    let value = (event.target.value || '').replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }
    this.dados.cpf = value;
    if (event.target) event.target.value = value;
  }

  formatarTelefone(event: any) {
    let value = (event.target.value || '').replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    if (value.length > 6) {
      value = value.replace(/(\d{2})(\d{5})(\d{1,4})/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/(\d{2})(\d{1,5})/, '($1) $2');
    }
    this.dados.telefone = value;
    if (event.target) event.target.value = value;
  }

  apenasNumeros(event: KeyboardEvent) {
    const tecla = event.key;
    if (tecla.length === 1 && !/^\d$/.test(tecla)) {
      event.preventDefault();
    }
  }

  private senhaForte(senha: string): boolean {
    return senha.length >= 8 &&
      /[A-Z]/.test(senha) &&
      /[a-z]/.test(senha) &&
      /\d/.test(senha) &&
      /[^A-Za-z0-9]/.test(senha);
  }

  get senhaValida() {
    const s = this.newPassword || '';
    return {
      tamanho: s.length >= 8,
      maiuscula: /[A-Z]/.test(s),
      minuscula: /[a-z]/.test(s),
      numero: /\d/.test(s),
      especial: /[^A-Za-z0-9]/.test(s)
    };
  }

}