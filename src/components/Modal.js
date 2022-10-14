
import './Modal.scss';

export const Modal = ({
	state, update
}) => {

	const {
		loading, log, dialog, dialogOk, dialogOkDisabledKey,
	} = state

	if (!loading && !dialog) return null

	return <div className="modal">
		{(log.length > 0 || dialog) && <div>
			{
				dialog && <div className='dialog'>
					{dialog}
					{dialogOk && <button disabled={state[dialogOkDisabledKey]} onClick={() => update('dialog', null)}>Ok</button>}
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