import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem,
  IonInput, IonCard, IonCardTitle, IonCardHeader, IonCardContent,
  IonLabel, IonBackButton, IonButtons, IonSelect, IonSelectOption, IonCheckbox, IonNote
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular/standalone';
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

  constructor(
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private auth: Auth,
    private firestore: Firestore,
    private database: Database,
    private ngZone: NgZone,
  ) {
    addIcons({ chevronDownOutline, chevronForwardOutline, checkmarkOutline });
  }

  ngOnInit() {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      this.googleFlow = true;
      this.dados.email = currentUser.email || '';
      this.dados.nomeCompleto = currentUser.displayName || '';
    }
  }

  async register() {
    if (!this.dados.termsAccepted) {
      this.showToast('Você precisa aceitar os termos de uso.');
      return;
    }

    if (!this.dados.nomeCompleto.trim()) {
      this.showToast('Preencha o nome completo.');
      return;
    }

    if (!this.dados.email.trim()) {
      this.showToast('Preencha o e-mail.');
      return;
    }

    if (this.isLoading) return;
    this.isLoading = true;

    try {
      let uid: string;

      if (this.googleFlow) {
        if (!this.auth.currentUser) {
          this.showToast('Erro: Sessão do Google não encontrada. Faça login novamente.');
          this.isLoading = false;
          return;
        }
        uid = this.auth.currentUser.uid;
      } else {
        if (!this.newPassword || this.newPassword !== this.confirmPassword) {
          this.showToast('As senhas não coincidem.');
          this.isLoading = false;
          return;
        }

        if (this.newPassword.length < 6) {
          this.showToast('A senha deve ter pelo menos 6 caracteres.');
          this.isLoading = false;
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          this.auth,
          this.dados.email.trim(),
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
        email: this.dados.email.toLowerCase().trim(),
        projeto: 'Luy-83',
        dataCriacao: new Date().toISOString(),
        provider: this.googleFlow ? 'google' : 'email',
        uid: uid,
        firstLogin: true
      };

      await setDoc(doc(this.firestore, 'usuarios', uid), dadosParaSalvar);

      this.database.setUser(dadosParaSalvar);

      await this.showToast('Cadastro realizado com sucesso!');

      this.ngZone.run(() => {
        this.router.navigate(['/tabs/tab1'], { replaceUrl: true });
      });

    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      let mensagem = 'Erro ao cadastrar. Tente novamente.';
      if (error.code === 'auth/email-already-in-use') mensagem = 'Este e-mail já está em uso.';
      if (error.code === 'auth/weak-password') mensagem = 'A senha é muito fraca. Use ao menos 6 caracteres.';
      if (error.code === 'auth/invalid-email') mensagem = 'E-mail inválido.';
      this.showToast(mensagem);
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
    this.showToast('Sessão encerrada.');
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  formatarCpf(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }
    this.dados.cpf = value;
  }

  formatarTelefone(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    if (value.length > 6) {
      value = value.replace(/(\d{2})(\d{5})(\d{1,4})/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/(\d{2})(\d{1,5})/, '($1) $2');
    }
    this.dados.telefone = value;
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
}