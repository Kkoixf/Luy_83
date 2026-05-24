import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface PacienteAtivo {
  id: number;
  nome: string;
  cpf: string;
  dataNasc?: string;
}

export interface ResultadoMedicao {
  bpm: number;
  spo2: number;
  temperatura: number;
}

@Injectable({ providedIn: 'root' })
export class MedicaoService {

  // Paciente atualmente selecionado para triagem
  private _paciente$ = new BehaviorSubject<PacienteAtivo | null>(null);
  paciente$ = this._paciente$.asObservable();

  // Resultado 
  private _resultado$ = new BehaviorSubject<ResultadoMedicao | null>(null);
  resultado$ = this._resultado$.asObservable();

  get pacienteAtivo(): PacienteAtivo | null {
    return this._paciente$.value;
  }

  get resultadoPendente(): ResultadoMedicao | null {
    return this._resultado$.value;
  }

  
  definirPaciente(p: PacienteAtivo) {
    this._paciente$.next(p);
    this._resultado$.next(null); 
  }


  definirResultado(r: ResultadoMedicao) {
    this._resultado$.next(r);
  }


  apagaPacienteControle() {
    this._paciente$.next(null);
  }

  limpar() {
    this._resultado$.next(null);
    
  }
}