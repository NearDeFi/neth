
import './Modal.scss';

export const Modal = ({
	state, update
}) => {

	const {
		loading, log, dialog, dialogOk, dialogCB, dialogOkKeys,
	} = state

	if (!loading && !dialog) return null

	const accepted = dialogOkKeys ? dialogOkKeys.reduce((a, c) => a && state[c] || false, true) : true

	return <div className="modal">
		{(log.length > 0 || dialog) && <div>
			{
				dialog && <div className='dialog'>
					{dialog}
					{dialogOk && <button disabled={!accepted} onClick={() => {
						update('dialog', null)
						if (dialogCB) dialogCB()
					}}>Ok</button>}
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