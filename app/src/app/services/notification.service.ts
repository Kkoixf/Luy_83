import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle, closeCircle, warning, informationCircle, close
} from 'ionicons/icons';

export type TipoNotificacao = 'success' | 'error' | 'warning' | 'info';

/**
 * Serviço central de notificações do app.
 *
 * Padroniza os toasts em um estilo único e profissional: faixa colorida
 * no topo da tela, ícone por tipo e cantos arredondados.
 *
 * Uso:
 *   this.notify.success('Cadastro realizado com sucesso!');
 *   this.notify.error('E-mail ou senha incorretos.');
 *   this.notify.warning('Preencha todos os campos.');
 *   this.notify.info('Sessão encerrada.');
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private toastController = inject(ToastController);

  private readonly config: Record<TipoNotificacao, { color: string; icon: string }> = {
    success: { color: 'success', icon: 'checkmark-circle' },
    error:   { color: 'danger',  icon: 'close-circle' },
    warning: { color: 'warning', icon: 'warning' },
    info:    { color: 'primary', icon: 'information-circle' },
  };

  constructor() {
    addIcons({ checkmarkCircle, closeCircle, warning, informationCircle, close });
  }

  success(message: string, duration = 2500) {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration = 3200) {
    return this.show(message, 'error', duration);
  }

  warning(message: string, duration = 2800) {
    return this.show(message, 'warning', duration);
  }

  info(message: string, duration = 2500) {
    return this.show(message, 'info', duration);
  }

  private async show(message: string, tipo: TipoNotificacao, duration: number) {
    const { color, icon } = this.config[tipo];
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'top',
      color,
      icon,
      cssClass: 'app-toast',
      swipeGesture: 'vertical',
      buttons: [{ icon: 'close', role: 'cancel', side: 'end' }],
    });
    await toast.present();
    return toast;
  }
}
