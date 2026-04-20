import { TestBed } from '@angular/core/testing';

import { Sqlite } from './sqlite';


// No arquivo services/sqlite.ts
async addPaciente(nome: string, cpf: string, dataNasc: string) {
  const sql = `INSERT INTO paciente (nome, cpf, data_nascimento) VALUES (?, ?, ?)`;
  return await this.db.run(sql, [nome, cpf, dataNasc]);
}


describe('Sqlite', () => {
  let service: Sqlite;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sqlite);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
