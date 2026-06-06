function pagRange(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (page <= 4)  return [1, 2, 3, 4, 5, '…', total]
  if (page >= total - 3) return [1, '…', total-4, total-3, total-2, total-1, total]
  return [1, '…', page-1, page, page+1, '…', total]
}

export default function Pagination({ total, page, limit, onPage }) {
  const totalPages = Math.ceil(total / limit) || 1
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to   = Math.min(page * limit, total)

  return (
    <div className="pagination-bar">
      <span>Mostrando {from}–{to} de {total}</span>
      <div className="pagination-controls">
        <button className="pg-btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <i className="bi bi-chevron-left" />
        </button>
        {pagRange(page, totalPages).map((p, i) =>
          p === '…'
            ? <button key={`dots-${i}`} className="pg-btn" disabled>…</button>
            : <button key={p} className={`pg-btn${p === page ? ' active' : ''}`} onClick={() => onPage(p)}>{p}</button>
        )}
        <button className="pg-btn" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          <i className="bi bi-chevron-right" />
        </button>
      </div>
    </div>
  )
}
