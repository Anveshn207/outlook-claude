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
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // ─── Client Endpoints ─────────────────────────────────────────────────────

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryClientsDto,
  ) {
    return this.clientsService.findAll(user.tenantId, query);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateClientDto,
  ) {
    return this.clientsService.create(user.tenantId, user.id, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.clientsService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.clientsService.remove(user.tenantId, id);
  }

  // ─── Contact Endpoints ────────────────────────────────────────────────────

  @Post(':clientId/contacts')
  createContact(
    @CurrentUser() user: CurrentUserPayload,
    @Param('clientId') clientId: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.clientsService.createContact(user.tenantId, clientId, dto);
  }

  @Patch(':clientId/contacts/:contactId')
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
