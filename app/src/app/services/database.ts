import { Injectable } from '@angular/core';
import { EmailService } from './email.service';

export interface UserData {
  id: number;
  username: string;
  password: string;
  email: string;
  role: string;
  nomeCompleto: string;
  genero: string;
  telefone: string;
  tipoProfissional: string;
  crm: string;
  uf: string;
  cpf: string;
  especialidade: string;
  termsAccepted: boolean;
  firstLogin: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class Database {
  private users: UserData[] = [];
  private passwordResetTokens: Map<string, { token: string; email: string; expiresAt: number }> = new Map();

  constructor(private emailService: EmailService) {
    this.initDatabase();
  }

  async initDatabase() {
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      this.users = JSON.parse(storedUsers);
    } else {
      this.users = [{
        id: 1, username: 'admin', password: 'admin123', email: 'admin@example.com', role: 'admin',
        nomeCompleto: 'Administrador', genero: '', telefone: '', tipoProfissional: 'medico',
        crm: '', uf: '', cpf: '', especialidade: '', termsAccepted: true, firstLogin: false
      }];
      localStorage.setItem('users', JSON.stringify(this.users));
    }
    console.log('Database initialized with users:', this.users);
  }

  async login(username: string, password: string): Promise<any> {
    const user = this.users.find(u => u.username === username && u.password === password);
    return user || null;
  }

  async register(username: string, password: string, dados: Partial<UserData> = {}): Promise<void> {
    if (this.users.find(u => u.username === username)) {
      throw new Error('Usuário já existe');
    }
    if (dados.cpf && this.users.find(u => u.cpf === dados.cpf)) {
      throw new Error('CPF já cadastrado');
    }
    const newUser: UserData = {
      id: this.users.length + 1,
      username,
      password,
      email: dados.email || '',
      role: 'user',
      nomeCompleto: dados.nomeCompleto || '',
      genero: dados.genero || '',
      telefone: dados.telefone || '',
      tipoProfissional: dados.tipoProfissional || 'medico',
      crm: dados.crm || '',
      uf: dados.uf || '',
      cpf: dados.cpf || '',
      especialidade: dados.especialidade || '',
      termsAccepted: dados.termsAccepted || false,
      firstLogin: true
    };
    this.users.push(newUser);
    localStorage.setItem('users', JSON.stringify(this.users));
  }

  markFirstLoginDone() {
    const user = this.getUser();
    if (user) {
      user.firstLogin = false;
      this.setUser(user);
      const idx = this.users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        this.users[idx].firstLogin = false;
        localStorage.setItem('users', JSON.stringify(this.users));
      }
    }
  }

  updateUser(updatedUser: Partial<UserData>) {
    const user = this.getUser();
    if (user) {
      const merged = { ...user, ...updatedUser };
      this.setUser(merged);
      const idx = this.users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        this.users[idx] = { ...this.users[idx], ...updatedUser };
        localStorage.setItem('users', JSON.stringify(this.users));
      }
    }
  }

  async deleteAccount(): Promise<void> {
    const user = this.getUser();
    if (user) {
      this.users = this.users.filter(u => u.id !== user.id);
      localStorage.setItem('users', JSON.stringify(this.users));
      this.logout();
    }
  }

  async findUserByEmail(email: string): Promise<any> {
    console.log('Procurando usuário com email:', email);
    const user = this.users.find(u => u.email === email);
    console.log('Usuário encontrado:', user);
    return user || null;
  }

  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; token: string }> {
    console.log('Enviando email de recuperação para:', email);

    const user = await this.findUserByEmail(email);
    if (!user) {
      return { success: false, token: '' };
    }

    // Gerar token único
    const token = this.generateRandomToken();
    const expiresAt = Date.now() + 3600000; // 1 hora

    // Armazenar token
    this.passwordResetTokens.set(token, { token, email, expiresAt });

    try {
      // Enviar email usando Firebase Authentication
      const result = await this.emailService.sendPasswordResetEmail(email);

      if (result.success) {
        console.log('Email enviado com sucesso via Firebase');
        return { success: true, token };
      } else {
        console.error('Erro ao enviar email:', result.message);
        return { success: false, token: '' };
      }
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      return { success: false, token: '' };
    }
  }

  async validatePasswordResetToken(token: string): Promise<boolean> {
    const tokenData = this.passwordResetTokens.get(token);
    if (!tokenData) {
      return false;
    }

    // Verificar se o token expirou
    if (Date.now() > tokenData.expiresAt) {
      this.passwordResetTokens.delete(token);
      return false;
    }

    return true;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const isValidToken = await this.validatePasswordResetToken(token);
    if (!isValidToken) {
      return { success: false, message: 'Token inválido ou expirado' };
    }

    const tokenData = this.passwordResetTokens.get(token);
    if (!tokenData) {
      return { success: false, message: 'Token não encontrado' };
    }

    const user = await this.findUserByEmail(tokenData.email);
    if (!user) {
      return { success: false, message: 'Usuário não encontrado' };
    }

    // Atualizar senha
    user.password = newPassword;
    localStorage.setItem('users', JSON.stringify(this.users));

    // Remover token usado
    this.passwordResetTokens.delete(token);

    console.log(`Senha redefinida para o usuário: ${user.username}`);
    return { success: true, message: 'Senha redefinida com sucesso' };
  }

  private generateRandomToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('user');
  }

  logout() {
    localStorage.removeItem('user');
  }

  setUser(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Status de conexão com a mão robótica
  isConnectedToHand(): boolean {
    return localStorage.getItem('handConnected') === 'true';
  }

  setConnectedToHand(connected: boolean) {
    localStorage.setItem('handConnected', connected.toString());
  }

  async waitForDbReady() {
    // Já está pronto
  }
}
