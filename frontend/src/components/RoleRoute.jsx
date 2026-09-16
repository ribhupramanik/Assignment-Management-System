import { Navigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

const RoleRoute = ({
  allowedRoles,
  children,
}) => {
  const { user } = useAuth()

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  if (!allowedRoles.includes(user.role)) {
    const redirectPath =
      user.role === 'admin'
        ? '/admin'
        : '/student'

    return (
      <Navigate
        to={redirectPath}
        replace
      />
    )
  }

  return children
}

export default RoleRoute