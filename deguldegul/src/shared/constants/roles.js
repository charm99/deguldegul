export const ROLE = Object.freeze({
  ADMIN: "ADM",
  MANAGER: "MGR",
  STAFF: "STF",
  MEMBER: "MBR",
});

export const ADMIN_ROLES = Object.freeze([
  ROLE.ADMIN,
  ROLE.MANAGER,
  ROLE.STAFF,
]);

export const USER_MANAGER_ROLES = Object.freeze([
  ROLE.ADMIN,
  ROLE.MANAGER,
]);
