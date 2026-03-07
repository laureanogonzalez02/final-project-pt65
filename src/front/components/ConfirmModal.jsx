const ConfirmModal = ({ id, title, message, warning, onConfirm }) => {
    return (
        <div className="modal fade" id={id} tabIndex="-1" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content rounded-4 shadow border-0">
                    <div className="modal-header border-0">
                        <h5 className="modal-title fw-bold">{title}</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div className="modal-body">
                        <p>{message}</p>
                        {warning && (
                            <div className="alert alert-warning small border-0">
                                <i className="fa-solid fa-triangle-exclamation me-2"></i>
                                {warning}
                            </div>
                        )}
                    </div>
                    <div className="modal-footer border-0">
                        <button type="button" className="btn btn-light fw-bold" data-bs-dismiss="modal">No, Cancelar</button>
                        <button type="button" className="btn btn-dark fw-bold px-4" data-bs-dismiss="modal" onClick={onConfirm}>
                            Sí, Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
