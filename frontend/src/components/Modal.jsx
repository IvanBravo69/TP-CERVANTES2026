import { createPortal } from 'react-dom'

export default function Modal({ open, onClose, title, size, footer, children }) {
  if (!open) return null
  return createPortal(
    <div className="modal-overlay show" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-box${size === 'lg' ? ' modal-lg' : ''}`}>
        <div className="modal-header">
          <h5>{title}</h5>
          <button className="btn-close" onClick={onClose}><i className="bi bi-x" /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

