import { useAuthStore } from '../store/authStore'

export interface Permissions {
  // Navigation visibility
  canSeeDashboard:   boolean
  canSeeStudents:    boolean
  canSeeAttendance:  boolean
  canSeeFees:        boolean
  canSeeTrials:      boolean
  canSeeCoaches:     boolean
  canSeeEvents:      boolean
  canSeeFinancials:  boolean
  canSeeSettings:    boolean

  // Student actions
  canAddStudent:    boolean
  canEditStudent:   boolean
  canDeleteStudent: boolean

  // Attendance actions
  canMarkAttendance: boolean

  // Fee actions
  canRecordPayment: boolean

  // Payroll actions
  canApprovePayroll: boolean

  // Event actions
  canManageEvents: boolean

  // Coach actions
  canViewAllCoaches:       boolean
  canConfirmOwnAttendance: boolean

  // Owner-only superpowers
  canManageCoaches:    boolean
  canChangeRoles:      boolean
  canDeactivateCoach:  boolean
  canManageSettings:   boolean
  canUploadLogo:       boolean
  canExportData:       boolean
  canAccessDangerZone: boolean
}

export function usePermissions(): Permissions {
  const { isHeadOrOwner, isOwner } = useAuthStore()
  const headOrOwner = isHeadOrOwner()
  const owner       = isOwner()

  return {
    // Navigation — head/owner sees everything; assistant sees their areas
    canSeeDashboard:  headOrOwner,
    canSeeStudents:   headOrOwner,
    canSeeAttendance: true,
    canSeeFees:       headOrOwner,
    canSeeTrials:     headOrOwner,
    canSeeCoaches:    true,          // both — but different views
    canSeeEvents:     true,
    canSeeFinancials: headOrOwner,
    canSeeSettings:   true,          // all coaches see Settings tab (different content by role)

    // Student actions — head/owner only
    canAddStudent:    headOrOwner,
    canEditStudent:   headOrOwner,
    canDeleteStudent: headOrOwner,

    // Attendance — both can mark
    canMarkAttendance: true,

    // Fee recording — head/owner only
    canRecordPayment: headOrOwner,

    // Payroll — head/owner only
    canApprovePayroll: headOrOwner,

    // Event management — head/owner only (both can view + set availability)
    canManageEvents: headOrOwner,

    // Coach actions
    canViewAllCoaches:       headOrOwner,
    canConfirmOwnAttendance: true,

    // Owner-only superpowers (Sahil only)
    canManageCoaches:    owner,
    canChangeRoles:      owner,
    canDeactivateCoach:  owner,
    canManageSettings:   owner,
    canUploadLogo:       owner,
    canExportData:       owner,
    canAccessDangerZone: owner,
  }
}
