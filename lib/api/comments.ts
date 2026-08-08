/**
 * Task comments.
 *
 * The same endpoints exist under `/employee`; these use the `/admin` prefix,
 * where an admin may comment on any task in the organization and delete
 * anyone's comment (editing stays author-only).
 */

import { axiosPrivate } from "@/app/axios/Axios";
import { ADMIN_ENDPOINTS } from "./endpoints";
import { unwrapList, unwrapResponse, type ListResult } from "./response";
import type {
  ApiComment,
  ApiResponse,
  CommentData,
  CommentRepliesData,
  CreateCommentRequest,
  EmptyData,
  MentionableUsersData,
  UpdateCommentRequest,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Reading                                                                    */
/* -------------------------------------------------------------------------- */

/** Top-level comments newest first, each with its replies nested oldest first. */
export async function listTaskComments(
  taskId: string,
  params: { page?: number; limit?: number } = {},
): Promise<ListResult<ApiComment>> {
  const { data } = await axiosPrivate.get(
    ADMIN_ENDPOINTS.TASK_COMMENTS(taskId),
    { params },
  );
  return unwrapList<ApiComment>(data, "comments");
}

/** Only needed when replies are paged separately from their parent. */
export async function listCommentReplies(
  commentId: string,
): Promise<ApiResponse<CommentRepliesData>> {
  const { data } = await axiosPrivate.get(
    ADMIN_ENDPOINTS.COMMENT_REPLIES(commentId),
  );
  return unwrapResponse<CommentRepliesData>(data);
}

/** Members of the task's project, for the @-mention picker. */
export async function listMentionableUsers(
  taskId: string,
): Promise<ApiResponse<MentionableUsersData>> {
  const { data } = await axiosPrivate.get(
    ADMIN_ENDPOINTS.TASK_MENTIONABLE(taskId),
  );
  return unwrapResponse<MentionableUsersData>(data);
}

/* -------------------------------------------------------------------------- */
/* Writing                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * `@name` or `@email` in the content is matched against the project's members
 * and notifies them. Omit `parentId` for a top-level comment — replying to a
 * reply is rejected, since threads are one level deep.
 */
export async function createTaskComment(
  taskId: string,
  payload: CreateCommentRequest,
): Promise<ApiResponse<CommentData>> {
  const { data } = await axiosPrivate.post(
    ADMIN_ENDPOINTS.TASK_COMMENTS(taskId),
    payload,
  );
  return unwrapResponse<CommentData>(data);
}

/** Authors only — the server returns 403 otherwise. Sets `isEdited`. */
export async function updateComment(
  commentId: string,
  payload: UpdateCommentRequest,
): Promise<ApiResponse<CommentData>> {
  const { data } = await axiosPrivate.put(
    ADMIN_ENDPOINTS.COMMENT(commentId),
    payload,
  );
  return unwrapResponse<CommentData>(data);
}

/** Soft delete. Admins may remove anyone's comment. */
export async function deleteComment(
  commentId: string,
): Promise<ApiResponse<EmptyData>> {
  const { data } = await axiosPrivate.delete(ADMIN_ENDPOINTS.COMMENT(commentId));
  return unwrapResponse<EmptyData>(data);
}

export type {
  ApiComment,
  ApiPersonRef,
  CreateCommentRequest,
  UpdateCommentRequest,
} from "./types";
