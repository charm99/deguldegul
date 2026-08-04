import { ADMIN_ROLES, ROLE, USER_MANAGER_ROLES } from "../constants/roles";

export function hasRole(profile, roles) {
  return Boolean(profile?.role && roles.includes(profile.role));
}

export function canAccessAdmin(profile) {
  return hasRole(profile, ADMIN_ROLES);
}

export function canManageUsers(profile) {
  return hasRole(profile, USER_MANAGER_ROLES);
}

export function canManageBattle(profile) {
  return hasRole(profile, USER_MANAGER_ROLES);
}

export function canSeePrivateUserInfo(profile) {
  return profile?.role === ROLE.ADMIN;
}

export function canManageNotice(profile) {
  return hasRole(profile, USER_MANAGER_ROLES);
}

export function isOwner(profile, ownerId) {
  return Boolean(profile?.id && ownerId === profile.id);
}

export function canManageOwnedContent(profile, ownerId) {
  return canManageNotice(profile) || isOwner(profile, ownerId);
}
