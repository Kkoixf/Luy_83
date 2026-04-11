import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { sendPasswordResetEmail as firebaseSendPasswordResetEmail } from 'firebase/auth';
import { firebaseAuth } from './firebase.config';

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  constructor(private http: HttpClient) { }

  /**
   * Envia email de recuperação de senha usando Firebase Authentication
   * O Firebase gerencia automaticamente os templates de email e links de recuperação
   *
   * @param email Email do usuário
   * @returns Promise com o resultado do envio
   */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Configuração do link de recuperação
      const actionCodeSettings = {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true, // Redireciona dentro do app em vez de abrir email
      };

      // Firebase Auth envia automaticamente um email com um link seguro
      // O email é enviado pelo serviço de email do Firebase (customizável no console)
      await firebaseSendPasswordResetEmail(firebaseAuth, email, actionCodeSettings);

      console.log(`Email de recuperação enviado para: ${email}`);
      return { success: true, message: 'Email enviado com sucesso!' };
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);

      // Mapear erros do Firebase
      let errorMessage = 'Erro ao enviar email';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Email não cadastrado no sistema';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Operação não permitida. Contate o administrador';
      }

      return { success: false, message: errorMessage };
    }
  }

  /**
   * Envia email customizado via Cloud Function
   * Útil para templates de email personalizados
   *
   * @param to Email do destinatário
   * @param subject Assunto do email
   * @param html Conteúdo HTML do email
   * @returns Promise com o resultado do envio
   */
  async sendCustomEmail(to: string, subject: string, html: string): Promise<{ success: boolean; message: string }> {
    try {
      // Chamar Cloud Function do Firebase
      const response = await this.http.post(
        'https://us-central1-luy-83.cloudfunctions.net/sendCustomEmail',
        { to, subject, html }
      ).toPromise();
      
      return { success: true, message: 'Email enviado com sucesso!' };
    } catch (error: any) {
      console.error('Erro ao enviar email customizado:', error);
      return { success: false, message: 'Erro ao processar envio de email' };
    }
  }
}