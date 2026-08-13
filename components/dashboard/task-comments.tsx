"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/auth";
import { toComment, toComments, toMentionUsers } from "@/lib/api/adapters";
import {
  createTaskComment,
  deleteComment,
  listMentionableUsers,
  listTaskComments,
  updateComment,
} from "@/lib/api/comments";
import { formatDateTime, initialsOf } from "@/lib/mock-data";
import type { MentionUser, TaskComment } from "@/lib/types";

export function TaskComments({
  taskId,
  currentUserId,
  onChange,
}: {
  taskId: string;
  currentUserId?: string;
  onChange?: () => void;
}) {
  const [comments, setComments] = React.useState<TaskComment[]>([]);
  const [mentionable, setMentionable] = React.useState<MentionUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [unavailable, setUnavailable] = React.useState(false);

  const [draft, setDraft] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<TaskComment | null>(null);
  const [replyDraft, setReplyDraft] = React.useState("");
  const [editing, setEditing] = React.useState<TaskComment | null>(null);
  const [editDraft, setEditDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const composerRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [list, users] = await Promise.all([
          listTaskComments(taskId, { limit: 100 }),
          listMentionableUsers(taskId).catch(() => null),
        ]);
        if (cancelled) return;

        setComments(toComments(list.items));
        setMentionable(users ? toMentionUsers(users.data.users) : []);
        setUnavailable(false);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load comments:", error);
        setUnavailable(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const insertMention = (user: MentionUser) => {
    const token = `@${user.name} `;
    if (replyTo) {
      setReplyDraft((prev) => (prev ? `${prev.trimEnd()} ${token}` : token));
    } else {
      setDraft((prev) => (prev ? `${prev.trimEnd()} ${token}` : token));
      composerRef.current?.focus();
    }
  };

  const post = async (content: string, parentId?: string) => {
    if (!content.trim()) return;

    setBusy(true);
    try {
      const { data } = await createTaskComment(taskId, {
        content: content.trim(),
        ...(parentId ? { parentId } : {}),
      });
      const created = toComment(data.comment);

      setComments((prev) =>
        parentId
          ? prev.map((comment) =>
              comment.id === parentId
                ? {
                    ...comment,
                    replies: [...comment.replies, created],
                    replyCount: comment.replyCount + 1,
                  }
                : comment,
            )
          : // Top-level comments are newest first.
            [created, ...prev],
      );

      if (parentId) {
        setReplyTo(null);
        setReplyDraft("");
      } else {
        setDraft("");
      }
      toast.success(parentId ? "Reply added" : "Comment added");
      onChange?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not post the comment."));
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!editing || !editDraft.trim()) return;

    setBusy(true);
    try {
      const { data } = await updateComment(editing.id, {
        content: editDraft.trim(),
      });
      const updated = toComment(data.comment);

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === updated.id
            ? { ...updated, replies: comment.replies }
            : {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply.id === updated.id ? updated : reply,
                ),
              },
        ),
      );
      setEditing(null);
      setEditDraft("");
      toast.success("Comment updated");
      onChange?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update the comment."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (comment: TaskComment) => {
    const previous = comments;

    setComments((prev) =>
      comment.parentId
        ? prev.map((entry) =>
            entry.id === comment.parentId
              ? {
                  ...entry,
                  replies: entry.replies.filter((r) => r.id !== comment.id),
                  replyCount: Math.max(0, entry.replyCount - 1),
                }
              : entry,
          )
        : prev.filter((entry) => entry.id !== comment.id),
    );

    try {
      const { message } = await deleteComment(comment.id);
      toast.success(message || "Comment deleted");
      onChange?.();
    } catch (error) {
      setComments(previous);
      toast.error(getErrorMessage(error, "Could not delete the comment."));
    }
  };

  const total = comments.reduce(
    (sum, comment) => sum + 1 + comment.replies.length,
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
        <CardDescription>
          {unavailable
            ? "Comments are unavailable right now."
            : `${total} comment${total === 1 ? "" : "s"}. Mention a project member with @ to notify them.`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Textarea
            ref={composerRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Write a comment… use @ to mention a project member"
            disabled={unavailable || busy}
          />

          {mentionable.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Mention:</span>
              {mentionable.map((user) => (
                <Button
                  key={user.id}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => insertMention(user)}
                >
                  @{user.name}
                </Button>
              ))}
            </div>
          )}

          <Button
            size="sm"
            className="bg-[#2d5a4c] hover:bg-[#234539]"
            onClick={() => post(draft)}
            disabled={unavailable || busy || !draft.trim()}
          >
            {busy ? "Posting…" : "Post comment"}
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : comments.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {unavailable
              ? "Could not load comments for this task."
              : "No comments yet."}
          </p>
        ) : (
          <ul className="space-y-4 border-t pt-4">
            {comments.map((comment) => (
              <li key={comment.id} className="space-y-3">
                <CommentRow
                  comment={comment}
                  canEdit={comment.authorId === currentUserId}
                  onEdit={() => {
                    setEditing(comment);
                    setEditDraft(comment.content);
                  }}
                  onDelete={() => remove(comment)}
                  onReply={() => {
                    setReplyTo(comment);
                    setReplyDraft("");
                  }}
                  isEditing={editing?.id === comment.id}
                  editDraft={editDraft}
                  onEditDraft={setEditDraft}
                  onCancelEdit={() => setEditing(null)}
                  onSaveEdit={saveEdit}
                  busy={busy}
                />

                {(comment.replies.length > 0 || replyTo?.id === comment.id) && (
                  <ul className="ml-4 space-y-3 border-l pl-4">
                    {comment.replies.map((reply) => (
                      <li key={reply.id}>
                        <CommentRow
                          comment={reply}
                          canEdit={reply.authorId === currentUserId}
                          onEdit={() => {
                            setEditing(reply);
                            setEditDraft(reply.content);
                          }}
                          onDelete={() => remove(reply)}
                          isEditing={editing?.id === reply.id}
                          editDraft={editDraft}
                          onEditDraft={setEditDraft}
                          onCancelEdit={() => setEditing(null)}
                          onSaveEdit={saveEdit}
                          busy={busy}
                        />
                      </li>
                    ))}

                    {replyTo?.id === comment.id && (
                      <li className="space-y-2">
                        <Textarea
                          value={replyDraft}
                          onChange={(e) => setReplyDraft(e.target.value)}
                          rows={2}
                          autoFocus
                          placeholder={`Reply to ${comment.authorName}…`}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="xs"
                            className="bg-[#2d5a4c] hover:bg-[#234539]"
                            onClick={() => post(replyDraft, comment.id)}
                            disabled={busy || !replyDraft.trim()}
                          >
                            Reply
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setReplyTo(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </li>
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function CommentRow({
  comment,
  canEdit,
  onEdit,
  onDelete,
  onReply,
  isEditing,
  editDraft,
  onEditDraft,
  onCancelEdit,
  onSaveEdit,
  busy,
}: {
  comment: TaskComment;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReply?: () => void;
  isEditing: boolean;
  editDraft: string;
  onEditDraft: (value: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex gap-3">
      <Avatar className="size-7 shrink-0">
        <AvatarFallback
          className="text-[0.65rem] font-semibold text-white"
          style={{ background: comment.authorAvatarColor }}
        >
          {initialsOf(comment.authorName)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{comment.authorName}</span>
          {comment.authorModel === "Admin" && (
            <Badge variant="secondary">Admin</Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDateTime(comment.createdAt)}
          </span>
          {comment.isEdited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={editDraft}
              onChange={(e) => onEditDraft(e.target.value)}
              rows={2}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="xs"
                className="bg-[#2d5a4c] hover:bg-[#234539]"
                onClick={onSaveEdit}
                disabled={busy || !editDraft.trim()}
              >
                Save
              </Button>
              <Button size="xs" variant="ghost" onClick={onCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 text-sm whitespace-pre-wrap">
            {comment.content}
          </p>
        )}

        {comment.mentions.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Notified: {comment.mentions.map((user) => user.name).join(", ")}
          </p>
        )}

        {!isEditing && (
          <div className="mt-1 flex gap-1">
            {onReply && (
              <Button size="xs" variant="ghost" onClick={onReply}>
                Reply
              </Button>
            )}
            {canEdit && (
              <Button size="xs" variant="ghost" onClick={onEdit}>
                Edit
              </Button>
            )}
            <Button size="xs" variant="ghost" onClick={onDelete}>
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
