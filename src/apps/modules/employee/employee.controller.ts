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
} from '../../../decorators/api.decorator.js';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import type { AuthUser } from '../../../interfaces/auth-user.interface.js';
import { PERMISSION_ACTION } from '../../../resources/data/permissions/actions/permission-action.data.js';
import { buildRoutePermission } from '../../../resources/data/permissions/permission-code.tool.js';
import { PERMISSION_SUBJECT } from '../../../resources/data/permissions/subjects/permission-subject.data.js';
import { parseCreateEmployeeDto } from './dto/create-employee.dto.js';
import { parseGender } from './dto/gender.tool.js';
import { parseSetEmployeeActiveDto } from './dto/set-employee-active.dto.js';
import { parseUpdateEmployeeDto } from './dto/update-employee.dto.js';
import { EmployeeService } from './employee.service.js';

/**
 * Employee admin API under `/api/{base}/v1/employee`.
 */
@ApiController({ code: 'EMPLOYEE', args: 'employee' })
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  /**
   * Distinct township / position values for list filters.
   *
   * `GET /employee/filter-options`
   */
  @ApiGet({
    code: 'EMPLOYEE_FILTER_OPTIONS',
    name: 'Employee list filter options',
    args: 'filter-options',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.EMPLOYEE,
      action: PERMISSION_ACTION.LIST,
      description: 'List employee filter options',
    }),
  })
  listFilterOptions() {
    return this.employeeService.listFilterOptions();
  }

  /**
   * Find which focal numbers already exist (import duplicate check).
   * Body: `{ focalNos: string[] }` — lookup by focalNo only.
   *
   * `POST /employee/import/focal-nos`
   */
  @ApiPost({
    code: 'EMPLOYEE_FOCAL_NOS',
    name: 'Find existing employee focal numbers',
    args: 'import/focal-nos',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.EMPLOYEE,
      action: PERMISSION_ACTION.LIST,
      description: 'Find existing employee focal numbers for import',
    }),
  })
  findExistingFocalNos(@Body() body: unknown) {
    return this.employeeService.findExistingFocalNos(
      this.parseFocalNosBody(body),
    );
  }

  /**
   * List employees by active status.
   *
   * `GET /employee?q=&page=&limit=&active=&gender=&townshipName=&position=`
   * `q` matches name, employee no (H…), and focal no only.
   */
  @ApiGet({
    code: 'EMPLOYEE_LIST',
    name: 'List employees',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.EMPLOYEE,
      action: PERMISSION_ACTION.LIST,
      description: 'List employees',
    }),
  })
  list(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
    @Query('gender') gender?: string,
    @Query('townshipName') townshipName?: string,
    @Query('position') position?: string,
  ) {
    return this.employeeService.list({
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      active: this.parseActiveQuery(active),
      gender: this.parseGenderQuery(gender),
      townshipName: townshipName?.trim() || undefined,
      position: position?.trim() || undefined,
    });
  }

  /**
   * Get one employee.
   *
   * `GET /employee/:id`
   */
  @ApiGet({
    code: 'EMPLOYEE_GET',
    name: 'Get employee',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.EMPLOYEE,
      action: PERMISSION_ACTION.READ,
      description: 'Read an employee',
    }),
  })
  getById(@Param('id') id: string) {
    return this.employeeService.getById(id);
  }

  /**
   * Create an employee.
   *
   * `POST /employee`
   */
  @ApiPost({
    code: 'EMPLOYEE_CREATE',
    name: 'Create employee',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.EMPLOYEE,
      action: PERMISSION_ACTION.CREATE,
      description: 'Create an employee',
    }),
  })
  create(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = this.parseOrBadRequest(() => parseCreateEmployeeDto(body));
    return this.employeeService.create(dto, user);
  }

  /**
   * Update an employee.
   *
   * `PUT /employee/:id`
   */
  @ApiPut({
    code: 'EMPLOYEE_UPDATE',
    name: 'Update employee',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.EMPLOYEE,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Update an employee',
    }),
  })
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseUpdateEmployeeDto(body));
    return this.employeeService.update(id, dto, user);
  }

  /**
   * Set whether an employee is active.
   *
   * `PATCH /employee/:id/active`
   */
  @ApiPatch({
    code: 'EMPLOYEE_SET_ACTIVE',
    name: 'Set employee active status',
    args: ':id/active',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.EMPLOYEE,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Activate or deactivate an employee',
    }),
  })
  setActive(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseSetEmployeeActiveDto(body));
    return this.employeeService.setActive(id, dto, user);
  }

  private parseActiveQuery(value?: string): boolean | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }
    if (value === 'true' || value === '1') {
      return true;
    }
    if (value === 'false' || value === '0') {
      return false;
    }
    throw new BadRequestException('active must be true or false');
  }

  private parseGenderQuery(value?: string) {
    if (value === undefined || value === '') {
      return undefined;
    }
    try {
      return parseGender(value, { required: false });
    } catch {
      throw new BadRequestException('gender must be MALE, FEMALE, or OTHER');
    }
  }

  private parseFocalNosBody(body: unknown): string[] {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Body must be an object');
    }
    const focalNos = (body as { focalNos?: unknown }).focalNos;
    if (!Array.isArray(focalNos)) {
      throw new BadRequestException('focalNos must be an array of strings');
    }
    return focalNos.map((value, index) => {
      if (typeof value !== 'string') {
        throw new BadRequestException(`focalNos[${index}] must be a string`);
      }
      return value;
    });
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
