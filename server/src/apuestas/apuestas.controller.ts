import { Controller, Post, Body } from '@nestjs/common';
import { ApuestasService } from './apuestas.service';

// DTO para nueva transacción
export class NewTransferenceDto {
  p_id_usuario: string;
  p_tipo_transaccion: string;
  p_monto: number;
  p_banco?: string;
  p_cuenta_cliente?: string;
  p_estado?: string;
}

// DTO para nueva apuesta
export class NewBetDto {
  p_id_usuario: string;
  p_id_juego: number;
  p_monto: number;
  p_resultado: string;
  p_multiplicador?: number;
}

@Controller('api/apuestas')
export class ApuestasController {
  constructor(private readonly apuestasService: ApuestasService) {}

  @Post('/new')
  async newTransferences(@Body() dto: NewTransferenceDto) {
    const {
      p_id_usuario,
      p_tipo_transaccion,
      p_monto,
      p_banco,
      p_cuenta_cliente,
      p_estado,
    } = dto;

    return this.apuestasService.newtrasnference(
      p_id_usuario,
      p_tipo_transaccion,
      p_monto,
      p_banco ?? '',
      p_cuenta_cliente ?? '',
      p_estado ?? 'APROBADO',
    );
  }

  @Post('/new/bet')
  async newBets(@Body() dto: NewBetDto) {
    const { p_id_usuario, p_id_juego, p_monto, p_resultado, p_multiplicador } = dto;
    return this.apuestasService.newBet(
      p_id_usuario,
      p_id_juego,
      p_monto,
      p_resultado,
      p_multiplicador ?? 2.0,
    );
  }
}
