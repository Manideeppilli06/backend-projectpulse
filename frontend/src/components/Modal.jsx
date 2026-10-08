import { useEffect } from 'react';

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal stack" onClick={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}