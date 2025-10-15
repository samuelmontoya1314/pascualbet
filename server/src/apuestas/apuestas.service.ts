import { Injectable } from '@nestjs/common';
import { supabase } from '../db/supa.client';

@Injectable()
export class ApuestasService {
  async newtrasnference(
    p_id_usuario: string,
    p_tipo_transaccion: string,
    p_monto: number,
    p_banco?: string,
    p_cuenta_cliente?: string,
    p_estado?: string,
  ): Promise<{ data: string }> {
    const {data, error} = await supabase.rpc('usp_transaccion_crear',{
      p_id_usuario,
      p_tipo_transaccion,
      p_monto,
      p_banco,
      p_cuenta_cliente,
      p_estado,
    })

    if (error) throw new Error(`Supabase error: ${error.message}`);
    
    return { data: data };
  }

  async newBet(
    p_id_usuario: string,
    p_id_juego: number,
    p_monto: number,
    p_resultado: string,
    p_multiplicador?: number,
    p_ganancia_neta?: number
  ): Promise<{ data: string }>{
    const { data, error } = await supabase.rpc('usp_apuesta_crear',{
      p_id_usuario,
      p_id_juego,
      p_monto,
      p_resultado,
      p_multiplicador,
      p_ganancia_neta
    })
    if (error) throw new Error(`Supabase error: ${error.message}`);
    return { data: data }
  }
}
