import {
  BadRequestException,
  Body,
  HttpException,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiController,
  ApiGet,
  ApiPatch,
  ApiPost,
  ApiPut,
} from '../../../decorators/api.decorator';
import { CurrentUser } from '../../../decorators/current-user.decorator';
import type { AuthUser } from '../../../interfaces/auth-user.interface';
import { PERMISSION_ACTION } from '../../../resources/data/permissions/actions/permission-action.data';
import { buildRoutePermission } from '../../../resources/data/permissions/permission-code.tool';
import { PERMISSION_SUBJECT } from '../../../resources/data/permissions/subjects/permission-subject.data';
import { CountryService } from './country.service';
import { parseCreateCountryDto } from './dto/create-country.dto';
import { parseSetCountryActiveDto } from './dto/set-country-active.dto';
import { parseUpdateCountryDto } from './dto/update-country.dto';

@ApiController({ code: 'COUNTRY', args: 'country' })
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @ApiGet({
    code: 'COUNTRY_LIST',
    name: 'List countries',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.COUNTRY,
      action: PERMISSION_ACTION.LIST,
      description: 'List countries',
    }),
  })
  list(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
  ) {
    return this.countryService.list({
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      active: this.parseActiveQuery(active),
    });
  }

  @ApiGet({
    code: 'COUNTRY_GET',
    name: 'Get country',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.COUNTRY,
      action: PERMISSION_ACTION.READ,
      description: 'Read a country',
    }),
  })
  getById(@Param('id') id: string) {
    return this.countryService.getById(id);
  }

  @ApiPost({
    code: 'COUNTRY_CREATE',
    name: 'Create country',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.COUNTRY,
      action: PERMISSION_ACTION.CREATE,
      description: 'Create a country',
    }),
  })
  create(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = this.parseOrBadRequest(() => parseCreateCountryDto(body));
    return this.countryService.create(dto, user);
  }

  @ApiPut({
    code: 'COUNTRY_UPDATE',
    name: 'Update country',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.COUNTRY,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Update a country',
    }),
  })
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseUpdateCountryDto(body));
    return this.countryService.update(id, dto, user);
  }

  @ApiPatch({
    code: 'COUNTRY_SET_ACTIVE',
    name: 'Set country active status',
    args: ':id/active',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.COUNTRY,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Activate or deactivate a country',
    }),
  })
  setActive(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseSetCountryActiveDto(body));
    return this.countryService.setActive(id, dto, user);
  }

  private parseActiveQuery(active?: string): boolean | undefined {
    if (active === undefined || active === '') {
      return undefined;
    }
    if (active === 'true') {
      return true;
    }
    if (active === 'false') {
      return false;
    }
    throw new BadRequestException('active must be true or false');
  }

  private parseOrBadRequest<T>(parse: () => T): T {
    try {
      return parse();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid request body',
      );
    }
  }
}
