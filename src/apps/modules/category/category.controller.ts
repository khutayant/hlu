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
import { CategoryService } from './category.service';
import { parseCreateCategoryDto } from './dto/create-category.dto';
import { parseSetCategoryActiveDto } from './dto/set-category-active.dto';
import { parseUpdateCategoryDto } from './dto/update-category.dto';

@ApiController({ code: 'CATEGORY', args: 'category' })
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiGet({
    code: 'CATEGORY_LIST',
    name: 'List categories',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.CATEGORY,
      action: PERMISSION_ACTION.LIST,
      description: 'List categories',
    }),
  })
  list(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
  ) {
    return this.categoryService.list({
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      active: this.parseActiveQuery(active),
    });
  }

  @ApiGet({
    code: 'CATEGORY_GET',
    name: 'Get category',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.CATEGORY,
      action: PERMISSION_ACTION.READ,
      description: 'Read a category',
    }),
  })
  getById(@Param('id') id: string) {
    return this.categoryService.getById(id);
  }

  @ApiPost({
    code: 'CATEGORY_CREATE',
    name: 'Create category',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.CATEGORY,
      action: PERMISSION_ACTION.CREATE,
      description: 'Create a category',
    }),
  })
  create(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = this.parseOrBadRequest(() => parseCreateCategoryDto(body));
    return this.categoryService.create(dto, user);
  }

  @ApiPatch({
    code: 'CATEGORY_UPDATE',
    name: 'Update category',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.CATEGORY,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Update a category',
    }),
  })
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseUpdateCategoryDto(body));
    return this.categoryService.update(id, dto, user);
  }

  @ApiPatch({
    code: 'CATEGORY_SET_ACTIVE',
    name: 'Set category active status',
    args: ':id/active',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.CATEGORY,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Activate or deactivate a category',
    }),
  })
  setActive(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseSetCategoryActiveDto(body));
    return this.categoryService.setActive(id, dto, user);
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
