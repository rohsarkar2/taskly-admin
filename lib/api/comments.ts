
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

export async function listCommentReplies(
  commentId: string,
): Promise<ApiResponse<CommentRepliesData>> {
  const { data } = await axiosPrivate.get(
    ADMIN_ENDPOINTS.COMMENT_REPLIES(commentId),
  );
  return unwrapResponse<CommentRepliesData>(data);
}

export async function listMentionableUsers(
  taskId: string,
): Promise<ApiResponse<MentionableUsersData>> {
  const { data } = await axiosPrivate.get(
    ADMIN_ENDPOINTS.TASK_MENTIONABLE(taskId),
  );
  return unwrapResponse<MentionableUsersData>(data);
}

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
