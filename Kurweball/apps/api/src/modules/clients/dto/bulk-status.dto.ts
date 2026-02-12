import { IsArray, IsString, IsEnum } from 'class-validator';
import { ClientStatus } from '@prisma/client';

export class BulkStatusClientsDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsEnum(ClientStatus)
  status: ClientStatus;
}
