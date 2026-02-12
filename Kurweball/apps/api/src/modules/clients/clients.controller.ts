import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { BulkStatusClientsDto } from './dto/bulk-status.dto';
import { BulkDeleteClientsDto } from './dto/bulk-delete.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { RequirePermissions } from '../auth/rbac';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // ─── Client Endpoints ─────────────────────────────────────────────────────

  @Get()
  @RequirePermissions('clients:read')
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryClientsDto,
  ) {
    return this.clientsService.findAll(user.tenantId, query);
  }

  @Post()
  @RequirePermissions('clients:create')
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateClientDto,
  ) {
    return this.clientsService.create(user.tenantId, user.id, dto);
  }

  @Patch('bulk-status')
  @RequirePermissions('clients:update')
  bulkUpdateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: BulkStatusClientsDto,
  ) {
    return this.clientsService.bulkUpdateStatus(user.tenantId, dto.ids, dto.status);
  }

  @Delete('bulk')
  @RequirePermissions('clients:delete')
  @HttpCode(HttpStatus.OK)
  bulkDelete(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: BulkDeleteClientsDto,
  ) {
    return this.clientsService.bulkDelete(user.tenantId, dto.ids);
  }

  @Get(':id')
  @RequirePermissions('clients:read')
  findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.clientsService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('clients:update')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('clients:delete')
  remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.clientsService.remove(user.tenantId, id);
  }

  // ─── Contact Endpoints ────────────────────────────────────────────────────

  @Post(':clientId/contacts')
  @RequirePermissions('clients:create')
  createContact(
    @CurrentUser() user: CurrentUserPayload,
    @Param('clientId') clientId: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.clientsService.createContact(user.tenantId, clientId, dto);
  }

  @Patch(':clientId/contacts/:contactId')
  @RequirePermissions('clients:update')
  updateContact(
    @CurrentUser() user: CurrentUserPayload,
    @Param('clientId') clientId: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.clientsService.updateContact(
      user.tenantId,
      clientId,
      contactId,
      dto,
    );
  }

  @Delete(':clientId/contacts/:contactId')
  @RequirePermissions('clients:delete')
  removeContact(
    @CurrentUser() user: CurrentUserPayload,
    @Param('clientId') clientId: string,
    @Param('contactId') contactId: string,
  ) {
    return this.clientsService.removeContact(
      user.tenantId,
      clientId,
      contactId,
    );
  }
}
