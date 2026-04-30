export default function Loading() {
  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#0e0c0b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: '3px solid rgba(217,119,6,0.2)',
        borderTopColor: '#d97706',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
