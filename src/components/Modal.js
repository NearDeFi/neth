
import './Modal.scss';

export default Modal = ({
	state, update
}) => {

	const {
		loading, log,
	} = state

	if (!loading) return null

	return <div className="modal">
		{log.length > 0 && <div>
			{
				log.map((l, i) => <p key={i}>{l}</p>)
			}
		</div>}
	</div>
}