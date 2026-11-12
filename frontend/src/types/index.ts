// ===== Auth Types =====

export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ===== Workspace Types =====

export interface Workspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceMemberRole;
  joinedAt: string;
}

export type WorkspaceMemberRole = "owner" | "admin" | "member";

// ===== Project Types =====

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  joinedAt: string;
}

export type ProjectStatus = "planning" | "in_progress" | "review" | "completed" | "cancelled";

export type ProjectMemberRole = "owner" | "admin" | "member" | "viewer";

// ===== Task Types =====

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId: string | null;
  assignedToName?: string | null;
  createdById: string;
  dueDate: string;
  createdAt: string;
  updatedAt?: string;
}

export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
}

// ===== Comment Types =====

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

// ===== Activity Types =====

export type EntityType = "workspace" | "project" | "task" | "comment" | "subtask";
export type ActionType = "created" | "updated" | "deleted" | "assigned" | "completed";

export interface Activity {
  id: string;
  workspaceId: string;
  userId: string;
  entityType: EntityType;
  entityId: string;
  action: ActionType;
  createdAt: string;
}

// ===== Notification Types =====

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ===== API Response Types =====

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  status: number;
  title: string;
  detail: string;
  instance?: string;
}
