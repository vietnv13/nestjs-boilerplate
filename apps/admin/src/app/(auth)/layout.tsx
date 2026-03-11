import type { ReactNode } from 'react'

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#002140',
        padding: '24px',
      }}
    >
      {children}
    </main>
  )
}

export default AuthLayout
