import {
  BadRequestException,
  Body,
} from '@nestjs/common';
import {
  ApiController,
  ApiDelete,
  ApiPatch,
} from '../../../decorators/api.decorator.js';
import { PERMISSION_ACTION } from '../../../resources/data/permissions/actions/permission-action.data.js';
import { buildRoutePermission } from '../../../resources/data/permissions/permission-code.tool.js';
import { PERMISSION_SUBJECT } from '../../../resources/data/permissions/subjects/permission-subject.data.js';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import type { AuthUser } from '../../../interfaces/auth-user.interface.js';
import { parseLinkProfileImageDto } from './dto/link-profile-image.dto.js';
import { UserProfileService } from './user-profile.service.js';

/**
 * Account-owner profile image APIs under `/api/{base}/v1/user/me`.
 *
 * Upload binaries through the File API (`POST /file/upload`), then link the
 * returned file id here. All mutations use {@link CurrentUser} only —
 * no target user id in the path/body.
 */
@ApiController({ code: 'USER_PROFILE', args: 'user/me' })
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  /**
   * Set the signed-in user's profile (avatar) image from an uploaded file id.
   *
   * `PATCH /user/me/profile-image`
   *
   * Body: `{ fileId }` — id returned by `POST /file/upload` (category
   * `PROFILE_IMAGE`). Account owner only.
   *
   * @returns Updated public user (includes `profileImage` / `coverImage` refs).
   */
  @ApiPatch({
    code: 'USER_PROFILE_SET_AVATAR',
    name: 'Set own profile image',
    args: 'profile-image',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_PROFILE,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Set the authenticated user profile image from a file id',
    }),
  })
  async setProfileImage(
    @CurrentUser() user: AuthUser,
    @Body() body: unknown,
  ) {
    try {
      const dto = parseLinkProfileImageDto(body);
      return await this.userProfileService.setProfileImage(user.id, dto.fileId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('required')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * Set the signed-in user's cover image from an uploaded file id.
   *
   * `PATCH /user/me/cover-image`
   *
   * Body: `{ fileId }` — id returned by `POST /file/upload` (category
   * `COVER_IMAGE`). Account owner only.
   *
   * @returns Updated public user (includes `profileImage` / `coverImage` refs).
   */
  @ApiPatch({
    code: 'USER_PROFILE_SET_COVER',
    name: 'Set own cover image',
    args: 'cover-image',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_PROFILE,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Set the authenticated user cover image from a file id',
    }),
  })
  async setCoverImage(
    @CurrentUser() user: AuthUser,
    @Body() body: unknown,
  ) {
    try {
      const dto = parseLinkProfileImageDto(body);
      return await this.userProfileService.setCoverImage(user.id, dto.fileId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('required')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * Clear the signed-in user's profile (avatar) image.
   *
   * `DELETE /user/me/profile-image`
   *
   * Account owner only — uses the bearer token user; no user id in the request.
   * Unlinks the image from the user (does not delete the stored file binary).
   *
   * @returns Updated public user (`profileImage` is `null`).
   */
  @ApiDelete({
    code: 'USER_PROFILE_CLEAR_AVATAR',
    name: 'Clear own profile image',
    args: 'profile-image',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_PROFILE,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Clear the authenticated user profile image',
    }),
  })
  clearProfileImage(@CurrentUser() user: AuthUser) {
    return this.userProfileService.clearProfileImage(user.id);
  }

  /**
   * Clear the signed-in user's cover image.
   *
   * `DELETE /user/me/cover-image`
   *
   * Account owner only — uses the bearer token user; no user id in the request.
   * Unlinks the image from the user (does not delete the stored file binary).
   *
   * @returns Updated public user (`coverImage` is `null`).
   */
  @ApiDelete({
    code: 'USER_PROFILE_CLEAR_COVER',
    name: 'Clear own cover image',
    args: 'cover-image',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_PROFILE,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Clear the authenticated user cover image',
    }),
  })
  clearCoverImage(@CurrentUser() user: AuthUser) {
    return this.userProfileService.clearCoverImage(user.id);
  }
}
