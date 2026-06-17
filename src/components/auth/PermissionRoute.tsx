import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions, type Permissions } from '../../hooks/usePermissions'
import { ROUTES } from '../../lib/constants'

interface Props {
  permKey: keyof Permissions
}

// Redirects to /attendance (the lowest-common-denominator page) when the
// logged-in role lacks the required permission for a route.
export function PermissionRoute({ permKey }: Props) {
  const permissions = usePermissions()
  if (!permissions[permKey]) return <Navigate to={ROUTES.ATTENDANCE} replace />
  return <Outlet />
}
