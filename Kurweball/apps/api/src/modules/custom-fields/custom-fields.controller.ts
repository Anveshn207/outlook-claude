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
import { CustomFieldsService } from './custom-fields.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { QueryCustomFieldsDto } from './dto/query-custom-fields.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/rbac';

@Controller('custom-fields')
@UseGuards(JwtAuthGuard)
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @Get()
  @RequirePermissions('custom-fields:read')
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryCustomFieldsDto,
  ) {
    return this.customFieldsService.findAll(user.tenantId, query);
  }

  @Post()
  @RequirePermissions('custom-fields:create')
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCustomFieldDto,
  ) {
    return this.customFieldsService.create(user.tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions('custom-fields:update')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCustomFieldDto,
  ) {
    return this.customFieldsService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('custom-fields:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    await this.customFieldsService.remove(user.tenantId, id);
  }
}
