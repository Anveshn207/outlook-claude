import { IsArray, IsString, IsEnum, ArrayMaxSize } from 'class-validator';
import { ClientStatus } from '@prisma/client';

export class BulkStatusClientsDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  ids: string[];

  @IsEnum(ClientStatus)
  status: ClientStatus;
}
