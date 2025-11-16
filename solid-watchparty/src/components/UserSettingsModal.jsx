/* library imports */
import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useSession } from "../hooks/useSession";

/* component imports */
import SWModal from '../components/SWModal';
import SWLoadingIcon from '../components/SWLoadingIcon';
import SWSwitch from '../components/SWSwitch';

/* util imports */
import { parseTitle } from '../utils/messageParser';

/* service imports */
import UserSolidService from "../services/user.solidservice";

function UserSettingsModal({ setModalIsShown, getAndSetName }) {
    const sessionContext = useSession();

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const nameRef = useRef(null);

    useEffect(() => {
        // Prefill current name if available
        let cancelled = false;
        (async () => {
            try {
                const name = await UserSolidService.getName(sessionContext, sessionContext.session.info.webId);
                if (!cancelled && !name?.error && nameRef.current) {
                    nameRef.current.value = name || '';
                }
            } catch (_) { /* noop */ }
        })();
        return () => { cancelled = true; };
    }, [sessionContext]);

    const onSaveName = async (e) => {
        e?.preventDefault?.();
        if (isSaving) return;
        setIsSaving(true);
        setError('');
        try {
            const newName = parseTitle(nameRef.current.value);
            await UserSolidService.changeName(sessionContext, sessionContext.session.info.webId, newName);
            getAndSetName?.();
            setModalIsShown(false);
        } catch (err) {
            setError('Failed to save name');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleAggregator = (enabled) => {
        sessionContext.setAggregatorEnabled?.(enabled);
    };

    const onClearCache = () => {
        try { sessionContext.auth?.clearCache?.(); } catch { /* ignore */ }
        try { localStorage.clear(); } catch { /* ignore */ }
        try { sessionStorage.clear(); } catch { /* ignore */ }
        window.location.reload();
    };

    const onClearAuth = () => {
        try { sessionContext.auth?.clearOidcTokens?.(); } catch { /* ignore */ }
        window.location.reload();
    };

    const onClearUma = () => {
        try { sessionContext.auth?.clearUmaCache?.(); } catch { /* ignore */ }
    };

    const onClearAggregatorCache = () => {
        try {
            localStorage.removeItem('messageLocationsServiceId');
            localStorage.removeItem('messageBoxesServiceId');
            localStorage.removeItem('overviewServiceId');
        } catch { /* ignore */ }
    };

    return (
        <SWModal className="relative rgb-bg-2 h-fit p-12 z-10 w-1/2 sw-border width-mobile" setIsShown={setModalIsShown}>
            <div className="mb-6">
                <p className="sw-fs-2 sw-fw-1">User Settings</p>
            </div>

            {/* Aggregator toggle */}
            <div className="my-4 flex items-center justify-between mt-8 p-4 sw-border">
                <div>
                    <p className="sw-fs-4 sw-fw-1 my-2">Enable Aggregator</p>
                    <p className="text-sm opacity-70">Controls how queries are executed, using an aggregator vs client side.</p>
                </div>
                <SWSwitch enabled={!!sessionContext.aggregatorEnabled} onSwitch={toggleAggregator} />
            </div>

            {/* Name change */}
            <form onSubmit={onSaveName} className="my-6 mt-8 p-4 sw-border">
                <p className="sw-fs-4 sw-fw-1 my-2">Your name</p>
                <div className={`sw-input${isSaving ? '-disabled' : ''} w-full flex justify-between`}>
                    <input className="w-full" type="text" placeholder="Display name" ref={nameRef} disabled={isSaving}/>
                    { isSaving ? <SWLoadingIcon className="w-4 h-4"/> : null}
                </div>
                <button type="submit" className="sw-btn sw-btn-1 mt-4" disabled={isSaving}>Save</button>
                {error && <div className="rgb-alert sw-fw-1 text-sm mt-2">{error}</div>}
            </form>

            {/* Danger zone */}
            <div className="mt-8 p-4 sw-border">
                <p className="sw-fw-1 mb-2">Cache</p>
                <p className="text-sm opacity-70 mb-3">Clear caches selectively. "Clear all" removes everything and reloads.</p>
                <div className="flex flex-col gap-2">
                    <button type="button" className="sw-btn sw-btn-2 border" onClick={onClearCache}>Clear all caches</button>
                    <button type="button" className="sw-btn sw-btn-2 border" onClick={onClearAuth}>Clear OIDC tokens</button>
                    <button type="button" className="sw-btn sw-btn-2 border" onClick={onClearUma}>Clear UMA tokens</button>
                    <button type="button" className="sw-btn sw-btn-2 border" onClick={onClearAggregatorCache}>Clear aggregator cache</button>
                </div>
            </div>
        </SWModal>
    );
}

UserSettingsModal.propTypes = {
    setModalIsShown: PropTypes.func.isRequired,
    getAndSetName: PropTypes.func,
};

export default UserSettingsModal;
