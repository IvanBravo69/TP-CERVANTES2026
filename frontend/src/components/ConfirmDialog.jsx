?import Modal from './Modal'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title || 'Confirmar acci�n'}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn btn-danger"  onClick={onConfirm} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : 'Confirmar'}
          </button>
        </>
      }
    >
      <p style={{ fontSize: '.875rem', color: 'var(--tx-2)' }}>{message || '�Est�s seguro de realizar esta acci�n?'}</p>
    </Modal>
  )
}

