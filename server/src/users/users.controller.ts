import { Controller, Get, Post, Put, Delete, Query, Param, Body, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { SessionGuard } from '../auth/session.guard';
import { AdminGuard } from '../auth/admin.guard';

// Data Transfer Object for creating a user
export class CreateUserDto {
  id_usuario: string;
  nombre: string;
  contrasena: string;
  fecha_nacimiento: string;
  rol?: string;
}

@Controller('api/users')
export class UsersController {
  constructor(private readonly UsersService: UsersService) {}

  @Post('/new')
  async create(@Body() createUserDto: CreateUserDto): Promise<{ data: string }> {
    return this.UsersService.create(
      createUserDto.id_usuario,
      createUserDto.nombre,
      createUserDto.contrasena,
      createUserDto.fecha_nacimiento,
      createUserDto.rol ?? 'Usuario',
    );
  }

  @Get('/f')
  @UseGuards(SessionGuard, AdminGuard) // Protegido: solo administradores
  async findAll(): Promise<{ data: string }> {
    return this.UsersService.findAll();
  }

  @Post('/login')
  async login(@Body() loginDto: { id_usuario: string; contrasena: string }): Promise<any> {
    return this.UsersService.Login(loginDto.id_usuario, loginDto.contrasena);
  }

  @Put('/')
  async updateProfile(
    @Query('p_id_usuario') p_id_usuario: string,
    @Query('p_nombre') p_nombre: string,
    @Query('p_nueva_contrasena') p_nueva_contrasena: string,
    @Query('p_fecha_nacimiento') p_fecha_nacimiento: Date,
  ): Promise<{ data: string }> {
    return this.UsersService.update(
      p_id_usuario,
      p_nombre,
      p_nueva_contrasena,
      p_fecha_nacimiento,
    );
  }
  @Get('/find/:p_id_usuario')
  @UseGuards(SessionGuard) // Protegido: requiere sesión válida
  asyncfind(
    @Param('p_id_usuario') p_id_usuario: string
  ){
    return this.UsersService.find(p_id_usuario);
  }

  @Put('/update/user')
  async updateUser(
    @Query('p_id_usuario_actual') p_id_usuario_actual: string,
    @Query('p_id_usuario_nuevo') p_id_usuario_nuevo: string
  ){
    return this.UsersService.updateUsuario(
      p_id_usuario_actual,
      p_id_usuario_nuevo
    )
  }

  @Get('/bet')
  async betUser(
    @Query('p_id_usuario') p_id_usuario: string
  ){
    return this.UsersService.apuestaUsuario(
      p_id_usuario
    )
  }

  @Get('/checkPass')
  async pass(
    @Query('plain') plain: string,
    @Query('hashed') hashed:string
  ){
    return this.UsersService.validatePassword(
      plain,
      hashed
    )
  }

  @Get('/getHash/:p_id_usuario')
  async hash(
    @Param('p_id_usuario') p_id_usuario: string,
  ){
    return this.UsersService.getHash(
      p_id_usuario,
    )
  }

}
