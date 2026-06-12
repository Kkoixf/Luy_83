import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

interface PacienteLS {
  id: number;
  nome: string;
  cpf: string;
  data_nascimento: string;
}

interface MedicaoLS {
  id: number;
  paciente_id: number;
  bpm: number | null;
  spo2: number | null;
  temperatura: number | null;
  data_hora_registro: string;
}

/**
 * Banco de dados local de pacientes/medições.
 *
 * No APK Android: usa SQLite nativo via @capacitor-community/sqlite.
 * No browser: tenta SQLite via jeep-sqlite (WASM). Se falhar
 * (LinkError comum em versões recentes do Chrome/Brave), cai
 * silenciosamente para um fallback baseado em localStorage,
 * mantendo a mesma API para a UI.
 */
@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private usandoFallback = false;

  private readonly LS_PACIENTES = 'luy83_pacientes';
  private readonly LS_MEDICOES = 'luy83_medicoes';

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

  isFallback(): boolean {
    return this.usandoFallback;
  }

  async iniciarBanco(): Promise<void> {
    if (this.db || this.usandoFallback) return;

    try {
      const existe = (await this.sqlite.isConnection('luy83_v1', false)).result;
      if (existe) {
        this.db = await this.sqlite.retrieveConnection('luy83_v1', false);
      } else {
        this.db = await this.sqlite.createConnection('luy83_v1', false, 'no-encryption', 1, false);
      }
      await this.db.open();
      await this.db.execute(this.scriptSQL);
      console.log('Banco SQLite inicializado.');
    } catch (error) {
      console.warn('SQLite indisponível — usando fallback localStorage:', error);
      this.db = null;
      // Em APK NUNCA cai aqui; em browser sim quando o WASM do jeep-sqlite quebra.
      if (Capacitor.getPlatform() === 'web') {
        this.usandoFallback = true;
      } else {
        throw error;
      }
    }
  }

  async addPaciente(nome: string, cpf: string, dataNasc: string) {
    await this.iniciarBanco();

    if (this.usandoFallback) {
      const pacientes = this.lerPacientes();
      const cpfDigitos = cpf.replace(/\D/g, '');
      if (pacientes.some(p => p.cpf.replace(/\D/g, '') === cpfDigitos)) {
        throw new Error('UNIQUE constraint failed: paciente.cpf');
      }
      const novo: PacienteLS = {
        id: this.proximoId(pacientes),
        nome,
        cpf,
        data_nascimento: dataNasc
      };
      pacientes.push(novo);
      this.salvar(this.LS_PACIENTES, pacientes);
      return { changes: { changes: 1, lastId: novo.id } };
    }

    if (!this.db) throw new Error('Banco de dados não disponível.');
    const sql = `INSERT INTO paciente (nome, cpf, data_nascimento) VALUES (?, ?, ?)`;
    return await this.db.run(sql, [nome, cpf, dataNasc]);
  }

  async listarPacientes() {
    await this.iniciarBanco();

    if (this.usandoFallback) {
      return this.lerPacientes().map(p => ({ ...p, medicoes: [] }));
    }

    if (!this.db) return [];
    const res = await this.db.query('SELECT * FROM paciente');
    const pacientes = res.values || [];
    return pacientes.map(p => ({ ...p, medicoes: [] }));
  }

  async deletarPaciente(id: number) {
    await this.iniciarBanco();

    if (this.usandoFallback) {
      const pacientes = this.lerPacientes().filter(p => p.id !== id);
      this.salvar(this.LS_PACIENTES, pacientes);
      const medicoes = this.lerMedicoes().filter(m => m.paciente_id !== id);
      this.salvar(this.LS_MEDICOES, medicoes);
      return { changes: { changes: 1 } };
    }

    if (!this.db) throw new Error('Banco de dados não disponível.');
    const sql = `DELETE FROM paciente WHERE id = ?`;
    return await this.db.run(sql, [id]);
  }

  async adicionarMedicao(dados: { paciente_id: number, bpm: number, spo2: number, temperatura: number }) {
    await this.iniciarBanco();

    if (this.usandoFallback) {
      const medicoes = this.lerMedicoes();
      const novo: MedicaoLS = {
        id: this.proximoId(medicoes),
        paciente_id: dados.paciente_id,
        bpm: dados.bpm,
        spo2: dados.spo2,
        temperatura: dados.temperatura,
        data_hora_registro: this.agoraISO()
      };
      medicoes.push(novo);
      this.salvar(this.LS_MEDICOES, medicoes);
      return { changes: { changes: 1, lastId: novo.id } };
    }

    if (!this.db) throw new Error('Banco de dados não disponível.');
    const sql = `INSERT INTO medicoes (paciente_id, bpm, spo2, temperatura) VALUES (?, ?, ?, ?)`;
    return await this.db.run(sql, [
      dados.paciente_id,
      dados.bpm,
      dados.spo2,
      dados.temperatura
    ]);
  }

  async buscarMedicoesPorPaciente(pacienteId: number) {
    await this.iniciarBanco();

    if (this.usandoFallback) {
      return this.lerMedicoes()
        .filter(m => m.paciente_id === pacienteId)
        .sort((a, b) => a.data_hora_registro.localeCompare(b.data_hora_registro))
        .reverse();
    }

    if (!this.db) return [];
    const sql = `SELECT * FROM medicoes WHERE paciente_id = ? ORDER BY data_hora_registro DESC`;
    const res = await this.db.query(sql, [pacienteId]);
    return res.values || [];
  }

  async deletarMedicao(id: number) {
    await this.iniciarBanco();

    if (this.usandoFallback) {
      const medicoes = this.lerMedicoes().filter(m => m.id !== id);
      this.salvar(this.LS_MEDICOES, medicoes);
      return { changes: { changes: 1 } };
    }

    if (!this.db) throw new Error('Banco de dados não disponível.');
    return await this.db.run('DELETE FROM medicoes WHERE id = ?', [id]);
  }

  // ---- helpers do fallback localStorage ----

  private lerPacientes(): PacienteLS[] {
    try {
      const raw = localStorage.getItem(this.LS_PACIENTES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private lerMedicoes(): MedicaoLS[] {
    try {
      const raw = localStorage.getItem(this.LS_MEDICOES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private salvar(chave: string, valor: any) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch {}
  }

  private proximoId(itens: { id: number }[]): number {
    return itens.length ? Math.max(...itens.map(i => i.id)) + 1 : 1;
  }

  private agoraISO(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
           `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
}
