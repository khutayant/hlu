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
} from '../../../decorators/api.decorator';
import { CurrentUser } from '../../../decorators/current-user.decorator';
import { Public } from '../../../decorators/public.decorator';
import type { AuthUser } from '../../../interfaces/auth-user.interface';
import { PERMISSION_ACTION } from '../../../resources/data/permissions/actions/permission-action.data';
import { buildRoutePermission } from '../../../resources/data/permissions/permission-code.tool';
import { PERMISSION_SUBJECT } from '../../../resources/data/permissions/subjects/permission-subject.data';
import { parseCreateEmployeeSignatureDto } from './dto/create-employee-signature.dto';
import { parseSetEmployeeSignatureActiveDto } from './dto/set-employee-signature-active.dto';
import { parseUpdateEmployeeSignatureDto } from './dto/update-employee-signature.dto';
import { EmployeeSignatureService } from './employee-signature.service';

@ApiController({ code: 'EMPLOYEE_SIGNATURE', args: 'employee-signature' })
export class EmployeeSignatureController {
  constructor(
    private readonly employeeSignatureService: EmployeeSignatureService,
  ) {}

  @ApiGet({
    code: 'EMPLOYEE_SIGNATURE_LIST_PRIMARY_BY_EMPLOYEES',
    name: 'List report signatures by employees',
    args: 'primary-by-employees',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.EMPLOYEE,
      action: PERMISSION_ACTION.LIST,
      description:
        'List one signature per employee (primary, else latest) by employee ids',
    }),
  })
  listPrimaryByEmployees(@Query('employeeIds') employeeIds?: string) {
    const ids = (employeeIds ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    return this.employeeSignatureService.listPrimaryByEmployeeIds(ids);
  }

  @ApiGet({
    code: 'EMPLOYEE_SIGNATURE_LIST',
    name: 'List employee signatures',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.EMPLOYEE,
      action: PERMISSION_ACTION.LIST,
      description: 'List employee signatures',
    }),
  })
  list(
    @Query('employeeId') employeeId?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
  ) {
    if (!employeeId?.trim()) {
      throw new BadRequestException('employeeId is required');
    }
    return this.employeeSignatureService.list({
      employeeId: employeeId.trim(),
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      active: this.parseActiveQuery(active),
    });
  }

  @ApiPost({
    code: 'EMPLOYEE_SIGNATURE_CREATE',
    name: 'Create employee signature',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.EMPLOYEE,
      action: PERMISSION_ACTION.CREATE,
      description: 'Create an employee signature',
    }),
  })
  create(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = this.parseOrBadRequest(() =>
      parseCreateEmployeeSignatureDto(body),
    );
    return this.employeeSignatureService.create(dto, user);
  }

  @ApiPatch({
    code: 'EMPLOYEE_SIGNATURE_UPDATE',
    name: 'Update employee signature',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.EMPLOYEE,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Update an employee signature',
    }),
  })
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() =>
      parseUpdateEmployeeSignatureDto(body),
    );
    return this.employeeSignatureService.update(id, dto, user);
  }

  @ApiPatch({
    code: 'EMPLOYEE_SIGNATURE_SET_ACTIVE',
    name: 'Set employee signature active status',
    args: ':id/active',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.EMPLOYEE,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Set employee signature active status',
    }),
  })
  setActive(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() =>
      parseSetEmployeeSignatureActiveDto(body),
    );
    return this.employeeSignatureService.setActive(id, dto, user);
  }

  /**
   * TEMP / REMOVE LATER — open seed from local-data empNo-focalNo files.
   * All created rows are `primary: true`.
   */
  @Public()
  @ApiPost({
    code: 'EMPLOYEE_SIGNATURE_SEED_LOCAL_TEMP',
    name: 'TEMP seed local emp-focal signatures',
    args: 'seed-local-temp',
    permission: null,
    description:
      'TEMP: seed signatures from local-data/e-signature/data [empNo]-[focalNo].ext as primary. Remove when done.',
  })
  seedLocalTemp() {
    return this.employeeSignatureService.seedFromLocalEmpFocalFiles();
  }

  private parseActiveQuery(active?: string): boolean | undefined {
    if (active === undefined || active === '') {
      return undefined;
    }
    if (active === 'true' || active === '1') {
      return true;
    }
    if (active === 'false' || active === '0') {
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
