import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/rbac';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users:read')
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryUsersDto,
  ) {
    return this.usersService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('users:read')
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.usersService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions('users:create')
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(user.tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions('users:update')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.tenantId, id, dto);
  }
}
