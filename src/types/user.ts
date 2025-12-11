/**
 * User Management Types
 *
 * Type definitions for users, roles, and permissions.
 *
 * @module types/user
 */

/**
 * User Status Enum
 */
export enum UserStatus {
  PENDING = 'pending',
  INVITED = 'invited',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/**
 * User Role
 */
export interface Role {
  id: string
  name: string
  isDefault: boolean
  locked: boolean
}

/**
 * User Entity
 */
export interface User {
  id: string
  orgId: string
  fullName: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  department: string
  roleId: string
  role?: Role
  address: string | null
  bio: string | null
  isActive: boolean
  status: UserStatus
  emailVerifiedAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

/**
 * User List Item (for table display)
 */
export interface UserListItem {
  id: string
  fullName: string
  firstName: string
  lastName: string
  email: string
  department: string
  role: {
    id: string
    name: string
  }
  status: UserStatus
  isActive: boolean
  createdAt: Date
}

/**
 * User List Response (paginated)
 */
export interface UserListResponse {
  data: UserListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * User Query Parameters
 */
export interface UserQueryParams {
  page?: number
  limit?: number
  search?: string
  roleId?: string
  department?: string
  status?: UserStatus
  isActive?: boolean
}

/**
 * Create User DTO
 */
export interface CreateUserDto {
  firstName: string
  lastName: string
  fullName?: string
  email: string
  phone?: string
  department: string
  roleId: string
  address?: string
  bio?: string
  sendInvitation: boolean
}

/**
 * Update User DTO
 */
export interface UpdateUserDto {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  department?: string
  roleId?: string
  address?: string
  bio?: string
  status?: UserStatus
  isActive?: boolean
}

/**
 * Permission Entity
 */
export interface Permission {
  id: string
  key: string
  description: string | null
}

/**
 * Permission Tree Node (for hierarchical display)
 */
export interface PermissionTreeNode {
  key: string
  label: string
  description: string
  children?: PermissionTreeNode[]
}

/**
 * Role with Permissions
 */
export interface RoleDetail {
  id: string
  name: string
  isDefault: boolean
  locked: boolean
  userCount: number
  permissions: {
    permissionId: string
    key: string
    granted: boolean
  }[]
  createdAt: Date
}

/**
 * Update Role Permissions DTO
 */
export interface UpdateRolePermissionsDto {
  permissions: {
    permissionId: string
    granted: boolean
  }[]
}
