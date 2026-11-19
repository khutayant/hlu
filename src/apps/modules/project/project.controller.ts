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
import type { AuthUser } from '../../../interfaces/auth-user.interface';
import { PERMISSION_ACTION } from '../../../resources/data/permissions/actions/permission-action.data';
import { buildRoutePermission } from '../../../resources/data/permissions/permission-code.tool';
import { PERMISSION_SUBJECT } from '../../../resources/data/permissions/subjects/permission-subject.data';
import { parseCreateProjectDto } from './dto/create-project.dto';
import { parseSetProjectActiveDto } from './dto/set-project-active.dto';
import { parseUpdateProjectDto } from './dto/update-project.dto';
import { ProjectService } from './project.service';

@ApiController({ code: 'PROJECT', args: 'project' })
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @ApiGet({
    code: 'PROJECT_LIST',
    name: 'List projects',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.PROJECT,
      action: PERMISSION_ACTION.LIST,
      description: 'List projects',
    }),
  })
  list(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
  ) {
    return this.projectService.list({
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      active: this.parseActiveQuery(active),
    });
  }

  @ApiGet({
    code: 'PROJECT_GET',
    name: 'Get project',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.PROJECT,
      action: PERMISSION_ACTION.READ,
      description: 'Read a project',
    }),
  })
  getById(@Param('id') id: string) {
    return this.projectService.getById(id);
  }

  @ApiPost({
    code: 'PROJECT_CREATE',
    name: 'Create project',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.PROJECT,
      action: PERMISSION_ACTION.CREATE,
      description: 'Create a project',
    }),
  })
  create(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = this.parseOrBadRequest(() => parseCreateProjectDto(body));
    return this.projectService.create(dto, user);
  }

  @ApiPatch({
    code: 'PROJECT_UPDATE',
    name: 'Update project',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.PROJECT,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Update a project',
    }),
  })
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseUpdateProjectDto(body));
    return this.projectService.update(id, dto, user);
  }

  @ApiPatch({
    code: 'PROJECT_SET_ACTIVE',
    name: 'Set project active status',
    args: ':id/active',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.PROJECT,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Activate or deactivate a project',
    }),
  })
  setActive(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseSetProjectActiveDto(body));
    return this.projectService.setActive(id, dto, user);
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
