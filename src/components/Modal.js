
import './Modal.scss';

export const Modal = ({
	state, update
}) => {

	const {
		loading, log, dialog,
	} = state

	if (!loading && !dialog) return null

	return <div className="modal">
		{(log.length > 0 || dialog) && <div>
			{
				dialog && <div className='dialog'>
					{dialog}
				</div>
			}
			{ (log.length > 0 || loading) && <>
				<h4>Log</h4>
				<div className='log'>
					{
						log.map((l, i) => <p key={i}>{l}</p>)
					}
				</div>
			</>}
		</div>}
	</div>
}