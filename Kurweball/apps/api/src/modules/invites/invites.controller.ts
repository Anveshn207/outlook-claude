import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/rbac';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@Controller('invites')
@UseGuards(JwtAuthGuard)
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  @RequirePermissions('users:create')
  async create(@CurrentUser() user: any, @Body() dto: CreateInviteDto) {
    return this.invitesService.create(user.tenantId, user.id, dto);
  }

  @Get()
  @RequirePermissions('users:read')
  async findAll(@CurrentUser() user: any) {
    return this.invitesService.findAll(user.tenantId);
  }

  @Delete(':id')
  @RequirePermissions('users:create')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    await this.invitesService.delete(user.tenantId, id);
    return { message: 'Invite deleted' };
  }

  @Get('validate/:token')
  async validateToken(@Param('token') token: string) {
    const invite = await this.invitesService.validateToken(token);
    return {
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    };
  }
}
