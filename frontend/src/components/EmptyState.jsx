?export default function EmptyState({ icon = 'bi-inbox', message = 'Sin resultados' }) {
  return (
    <div className="empty-state">
      <i className={`bi ${icon}`} />
      <p>{message}</p>
    </div>
  )
}

