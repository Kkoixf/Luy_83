import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;

  private scriptSQL = `
    CREATE TABLE IF NOT EXISTS paciente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf TEXT UNIQUE,
      data_nascimento TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS medicoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER NOT NULL,
      bpm INTEGER,
      spo2 INTEGER,
      temperatura REAL,
      data_hora_registro TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (paciente_id) REFERENCES paciente(id) ON DELETE CASCADE
    );
  `;

  constructor() {}

  async iniciarBanco() {
    try {
      this.db = await this.sqlite.createConnection('luy83_v1', false, 'no-encryption', 1, false);
      await this.db.open();
      await this.db.execute(this.scriptSQL);
      console.log('Banco de dados SQLite inicializado com sucesso.');
    } catch (error) {
      console.error('Erro ao abrir o banco de dados:', error);
    }
  }


async addPaciente(nome: string, cpf: string, dataNasc: string) {

  if (!this.db) {
    await this.iniciarBanco();
  }
  
  const sql = `INSERT INTO paciente (nome, cpf, data_nascimento) VALUES (?, ?, ?)`;
  return await this.db.run(sql, [nome, cpf, dataNasc]);
}

  async listarPacientes() {
    
    const res = await this.db.query('SELECT * FROM paciente');
    const pacientes = res.values || [];
    

    return pacientes.map(p => ({ ...p, medicoes: [] }));
  }

  async deletarPaciente(id: number) {
    const sql = `DELETE FROM paciente WHERE id = ?`;
    return await this.db.run(sql, [id]);
  }

  

  async adicionarMedicao(dados: { paciente_id: number, bpm: number, spo2: number, temperatura: number }) {
    const sql = `INSERT INTO medicoes (paciente_id, bpm, spo2, temperatura) VALUES (?, ?, ?, ?)`;
    return await this.db.run(sql, [
      dados.paciente_id, 
      dados.bpm, 
      dados.spo2, 
      dados.temperatura
    ]);
  }

  async buscarMedicoesPorPaciente(pacienteId: number) {
    const sql = `SELECT * FROM medicoes WHERE paciente_id = ? ORDER BY data_hora_registro DESC`;
    const res = await this.db.query(sql, [pacienteId]);
    return res.values || [];
  }
}