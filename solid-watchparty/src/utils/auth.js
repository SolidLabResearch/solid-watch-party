export class Auth {
    OidcAccessToken;
    activeRequests = 0;
    maxConcurrentRequests = 100;
    requestQueue = [];
    OidcToken;
    OidcRefreshToken;
    OidcTokenExpiry;
    OidcRefreshTimerId;
    WebId;
    umaPermissionTokens = new Map();

    constructor() {
        this.hydrateUmaTokens();
    }

    async login(issuer, clientId, redirectUri, scope = 'openid profile offline_access') {
        // Fetch OIDC configuration to get authorization endpoint
        const config = await this.getOidcConfig(issuer);
        if (!config.authorization_endpoint) {
            throw new Error('Missing authorization_endpoint in OIDC configuration');
        }
        // Generate PKCE code verifier & state
        const state = this.generateRandomString();
        const codeVerifier = this.generateRandomString();
        const codeChallenge = await this.pkceChallenge(codeVerifier);
        // Persist values for redirect handling
        sessionStorage.setItem('oidc_state', state);
        sessionStorage.setItem('oidc_code_verifier', codeVerifier);
        sessionStorage.setItem('oidc_issuer', issuer);
        sessionStorage.setItem('oidc_client_id', clientId);
        sessionStorage.setItem('oidc_redirect_uri', redirectUri);
        // Build authorization URL
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            scope,
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });
        const authUrl = `${config.authorization_endpoint}?${params.toString()}`;
        // Redirect browser
        window.location.href = authUrl;
    }

    async initSessionFromRedirect() {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        if (!code) {
            // Nothing to do
            return false;
        }
        const storedState = sessionStorage.getItem('oidc_state');
        if (!state || state !== storedState) {
            throw new Error('OIDC state mismatch');
        }
        const issuer = sessionStorage.getItem('oidc_issuer');
        const clientId = sessionStorage.getItem('oidc_client_id');
        const redirectUri = sessionStorage.getItem('oidc_redirect_uri');
        const codeVerifier = sessionStorage.getItem('oidc_code_verifier');
        if (!issuer || !clientId || !redirectUri || !codeVerifier) {
            throw new Error('Missing stored OIDC parameters');
        }
        const config = await this.getOidcConfig(issuer);
        if (!config.token_endpoint) {
            throw new Error('Missing token_endpoint in OIDC configuration');
        }
        // Exchange authorization code for tokens
        const bodyParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            code_verifier: codeVerifier
        });
        const tokenResp = await fetch(config.token_endpoint, {
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: bodyParams.toString()
        });
        if (!tokenResp.ok) {
            throw new Error(`Token endpoint error ${tokenResp.status}`);
        }
        const tokenJson = await tokenResp.json();
        this.OidcAccessToken = tokenJson.access_token;
        this.OidcToken = tokenJson.id_token; // ID token
        this.OidcRefreshToken = tokenJson.refresh_token; // may be undefined if offline_access not granted
        if (tokenJson.id_token) {
            this.WebId = this.extractWebId(tokenJson.id_token);
        }
        if (tokenJson.expires_in) {
            this.OidcTokenExpiry = Date.now() + (tokenJson.expires_in * 1000);
            this.scheduleRefresh(config.token_endpoint, clientId);
        }
        // Clean query params from URL (optional aesthetic)
        window.history.replaceState({}, document.title, redirectUri);
        return true;
    }

    scheduleRefresh(tokenEndpoint, clientId) {
        if (!this.OidcRefreshToken || !this.OidcTokenExpiry) {
            return;
        }
        // Refresh 1 minute before expiry
        const refreshInMs = Math.max(this.OidcTokenExpiry - Date.now() - 60_000, 5_000);
        if (this.OidcRefreshTimerId) {
            clearTimeout(this.OidcRefreshTimerId);
        }
        this.OidcRefreshTimerId = setTimeout(() => {
            this.refreshTokens(tokenEndpoint, clientId).catch(err => {
                console.error('OIDC token refresh failed', err);
            });
        }, refreshInMs);
    }

    async refreshTokens(tokenEndpoint, clientId) {
        if (!this.OidcRefreshToken) return;
        const bodyParams = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: this.OidcRefreshToken,
            client_id: clientId
        });
        const resp = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {'content-type': 'application/x-www-form-urlencoded'},
            body: bodyParams.toString()
        });
        if (!resp.ok) {
            throw new Error(`Refresh token endpoint error ${resp.status}`);
        }
        const json = await resp.json();
        if (json.access_token) this.OidcAccessToken = json.access_token;
        if (json.id_token) {
            this.OidcToken = json.id_token;
            this.WebId = this.extractWebId(json.id_token);
        }
        if (json.refresh_token) this.OidcRefreshToken = json.refresh_token;
        if (json.expires_in) {
            this.OidcTokenExpiry = Date.now() + (json.expires_in * 1000);
            this.scheduleRefresh(tokenEndpoint, clientId);
        }
    }

    async getOidcConfig(issuer) {
        const res = await fetch(`${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`);
        if (!res.ok) throw new Error('Failed fetching OIDC configuration');
        return res.json();
    }

    generateRandomString(bytes = 64) {
        const arr = new Uint8Array(bytes);
        window.crypto.getRandomValues(arr);
        return Array.from(arr).map(b => ('0' + b.toString(16)).slice(-2)).join('');
    }

    async pkceChallenge(verifier) {
        const data = new TextEncoder().encode(verifier);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        const arr = Array.from(new Uint8Array(digest));
        const base64 = btoa(String.fromCharCode.apply(null, arr));
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    async createClaim(ticket) {
        const payload = {
            grant_type: 'urn:ietf:params:oauth:grant-type:uma-ticket',
            ticket,
        };
        if (this.OidcAccessToken) {
            payload.claim_token = this.OidcAccessToken;
            payload.claim_token_format = 'http://openid.net/specs/openid-connect-core-1_0.html#IDToken';
        }
        return payload;
    }

    async acquireRequestSlot() {
        return new Promise((resolve) => {
            if (this.activeRequests < this.maxConcurrentRequests) {
                this.activeRequests++;
                resolve();
            } else {
                this.requestQueue.push(() => {
                    this.activeRequests++;
                    resolve();
                });
            }
        });
    }

    releaseRequestSlot() {
        this.activeRequests--;
        if (this.requestQueue.length > 0) {
            const nextRequest = this.requestQueue.shift();
            if (nextRequest) {
                nextRequest();
            }
        }
    }

    async throttledFetch(input, init) {
        await this.acquireRequestSlot();
        try {
            return await fetch(input, init);
        } finally {
            this.releaseRequestSlot();
        }
    }

    async getTokenEndpoint(asUri) {
        const uma2ConfigResponse = await this.throttledFetch(`${asUri}/.well-known/uma2-configuration`);
        if (!uma2ConfigResponse.ok) {
            return undefined;
        }
        const uma2Config = await uma2ConfigResponse.json();
        return uma2Config.token_endpoint;
    }

    buildUmaTokenKey(resourceUrl, method = 'GET') {
        return `${method.toUpperCase()} ${resourceUrl}`;
    }

    hydrateUmaTokens() {
        try {
            const raw = sessionStorage.getItem('uma_permission_tokens');
            if (!raw) return;
            const parsed = JSON.parse(raw);
            const now = Date.now();
            for (const [key, entry] of Object.entries(parsed)) {
                if (entry && entry.access_token) {
                    if (entry.expires_at && now > entry.expires_at) {
                        continue; // skip expired
                    }
                    this.umaPermissionTokens.set(key, {
                        token_type: entry.token_type,
                        access_token: entry.access_token,
                        expires_at: entry.expires_at
                    });
                }
            }
            // Persist again to drop any expired entries removed during hydration
            this.persistUmaTokens();
        } catch { /* ignore parse errors */ }
    }

    persistUmaTokens() {
        const obj = {};
        for (const [key, entry] of this.umaPermissionTokens.entries()) {
            obj[key] = entry;
        }
        try { sessionStorage.setItem('uma_permission_tokens', JSON.stringify(obj)); } catch { /* storage may fail */ }
    }

    getStoredUmaToken(resourceUrl, method = 'GET') {
        const key = this.buildUmaTokenKey(resourceUrl, method);
        const entry = this.umaPermissionTokens.get(key);
        if (!entry) return undefined;
        if (entry.expires_at && Date.now() > entry.expires_at) {
            this.umaPermissionTokens.delete(key);
            this.persistUmaTokens();
            return undefined;
        }
        return entry;
    }

    storeUmaToken(resourceUrl, method, token) {
        const key = this.buildUmaTokenKey(resourceUrl, method);
        const expires_at = token.expires_in ? Date.now() + (token.expires_in * 1000) : undefined;
        this.umaPermissionTokens.set(key, {
            token_type: token.token_type,
            access_token: token.access_token,
            expires_at
        });
        this.persistUmaTokens();
    }

    async fetch(input, init) {
        const resourceUrl = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);
        const method = init?.method || 'GET';

        // Pre-attach UMA permission token if we already have a valid one for this resource+method
        const existingUmaToken = this.getStoredUmaToken(resourceUrl, method);
        if (existingUmaToken) {
            init = init || {};
            init.headers = { ...(init.headers || {}), Authorization: `${existingUmaToken.token_type} ${existingUmaToken.access_token}` };
        }

        let response = await this.throttledFetch(input, init);
        if (response.status !== 401) {
            return response;
        }
        // If we got a 401 while using a stored UMA token, discard it and retry without it once.
        if (existingUmaToken) {
            this.umaPermissionTokens.delete(this.buildUmaTokenKey(resourceUrl, method));
            // Remove Authorization header and retry once to obtain a new ticket.
            const retryInit = { ...(init || {}) };
            if (retryInit.headers) {
                const { Authorization, authorization, ...rest } = retryInit.headers; // strip any casing
                retryInit.headers = rest;
            }
            response = await this.throttledFetch(input, retryInit);
            if (response.status !== 401) {
                return response;
            }
        }

        const wwwAuthenticateHeader = response.headers.get('WWW-Authenticate');
        if (!wwwAuthenticateHeader) {
            return response; // Possibly non-UMA 401; respect suppression flag
        }

        // Parse UMA header: UMA as_uri="...", ticket="..." [, ...]
        const { as_uri, ticket } = Object.fromEntries(wwwAuthenticateHeader.replace(/^UMA /, '').split(', ').map(
            param => param.split('=').map(s => s.replace(/"/g, ''))
        ));

        const tokenEndpoint = await this.getTokenEndpoint(as_uri);
        if (!tokenEndpoint) {
            return response;
        }

        const asRequestResponse = await this.throttledFetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(await this.createClaim(ticket))
        });
        if (!asRequestResponse.ok) {
            return asRequestResponse;
        }

        const asResponse = await asRequestResponse.json();
        this.storeUmaToken(resourceUrl, method, asResponse);

        // Attach the freshly obtained UMA permission token and retry the original request
        const finalInit = init || {};
        finalInit.headers = { ...(finalInit.headers || {}), Authorization: `${asResponse.token_type} ${asResponse.access_token}` };
        return await this.throttledFetch(input, finalInit);
    }

    extractWebId(idToken) {
        try {
            const [, payload] = idToken.split('.');
            if (!payload) return undefined;
            const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
            // Solid providers may include 'webid' claim; fallback to 'sub'
            return decoded.webid || decoded.sub;
        } catch {
            return undefined;
        }
    }

    clearCache() {
        try {
            // Clear UMA tokens (memory + sessionStorage)
            this.umaPermissionTokens.clear();
            sessionStorage.removeItem('uma_permission_tokens');
        } catch { /* ignore */ }

        try {
            // Cancel refresh timer
            if (this.OidcRefreshTimerId) {
                clearTimeout(this.OidcRefreshTimerId);
                this.OidcRefreshTimerId = undefined;
            }
            // Wipe OIDC tokens and identity
            this.OidcAccessToken = undefined;
            this.OidcToken = undefined;
            this.OidcRefreshToken = undefined;
            this.OidcTokenExpiry = undefined;
            this.WebId = undefined;
        } catch { /* ignore */ }

        try {
            // Remove PKCE/login flow values from session storage
            sessionStorage.removeItem('oidc_state');
            sessionStorage.removeItem('oidc_code_verifier');
            sessionStorage.removeItem('oidc_issuer');
            sessionStorage.removeItem('oidc_client_id');
            sessionStorage.removeItem('oidc_redirect_uri');
        } catch { /* ignore */ }
    }
}
