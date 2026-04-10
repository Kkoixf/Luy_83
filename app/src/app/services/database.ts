import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Database {
  private users: any[] = [];

  constructor() {
    this.initDatabase();
  }

  async initDatabase() {
    // Simular inicialização
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      this.users = JSON.parse(storedUsers);
    } else {
      // Usuário admin padrão
      this.users = [{ id: 1, username: 'admin', password: 'admin123', role: 'admin' }];
      localStorage.setItem('users', JSON.stringify(this.users));
    }
    console.log('Database initialized with users:', this.users);
  }

  async login(username: string, password: string): Promise<any> {
    console.log('Database login chamado com:', username, password);
    const user = this.users.find(u => u.username === username && u.password === password);
    console.log('Usuário encontrado:', user);
    return user || null;
  }

  async register(username: string, password: string): Promise<void> {
    console.log('Database register chamado com:', username, password);
    if (this.users.find(u => u.username === username)) {
      throw new Error('Usuário já existe');
    }
    const newUser = { id: this.users.length + 1, username, password, role: 'user' };
    this.users.push(newUser);
    localStorage.setItem('users', JSON.stringify(this.users));
    console.log('Usuário registrado');
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
