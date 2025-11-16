export class Auth {
    OidcAccessToken;
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

    async fetchAccessToken(tokenEndpoint, request, claims) {
        // Reduced internal logging; track claims used for concise summary
        let content;
        let claimsUsed = claims ? [...claims] : undefined;
        if (claims) {
            content = { grant_type: 'urn:ietf:params:oauth:grant-type:uma-ticket', claim_tokens: claims };
        } else {
            content = {
                grant_type: 'urn:ietf:params:oauth:grant-type:uma-ticket',
                claim_token: this.OidcAccessToken,
                claim_token_format: 'http://openid.net/specs/openid-connect-core-1_0.html#IDToken',
            };
            claimsUsed = [{ claim_token: this.OidcAccessToken, claim_token_format: 'http://openid.net/specs/openid-connect-core-1_0.html#IDToken' }];
        }
        if (typeof request === 'string') content.ticket = request; else content.permissions = request;

        const asRequestResponse = await fetch(tokenEndpoint, {
            method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(content)
        });

        if (asRequestResponse.status === 403) {
            let asRequestResponseJson;
            try { asRequestResponseJson = await asRequestResponse.json(); } catch { return { error: new Error('403 without JSON body'), token: undefined, tokenType: undefined, expiresIn: undefined, claimsUsed }; }
            try {
                claimsUsed = await this.gatherClaims(claimsUsed || [], asRequestResponseJson.required_claims);
            } catch (e) {
                return { error: e, token: undefined, tokenType: undefined, expiresIn: undefined, claimsUsed };
            }
            return this.fetchAccessToken(tokenEndpoint, asRequestResponseJson.ticket, claimsUsed);
        }

        if (asRequestResponse.status !== 200) {
            const text = await asRequestResponse.text();
            return { error: new Error(`Failed to fetch access token, error: ${text}`), token: undefined, tokenType: undefined, expiresIn: undefined, claimsUsed };
        }

        const asResponse = await asRequestResponse.json();
        return { token: asResponse.access_token, tokenType: asResponse.token_type, expiresIn: asResponse.expires_in, error: undefined, claimsUsed };
    }

    async gatherClaims(claims, requiredClaims) {
        for (const requiredClaim of requiredClaims) {
            switch (requiredClaim['claim_token_format']) {
                case 'http://openid.net/specs/openid-connect-core-1_0.html#IDToken':
                    claims.push({ claim_token: await this.createClaimToken(), claim_token_format: 'http://openid.net/specs/openid-connect-core-1_0.html#IDToken' });
                    break;
                case 'urn:ietf:params:oauth:token-type:access_token':
                    const { token, error } = await this.fetchAccessToken(
                        requiredClaim.details.issuer + '/token',
                        [{ resource_id: requiredClaim.details.resource_id, resource_scopes: requiredClaim.details.resource_scopes }]
                    );
                    if (error) throw error;
                    claims.push({ claim_token: token, claim_token_format: 'urn:ietf:params:oauth:token-type:access_token' });
                    break;
                default:
                    throw new Error(`Unsupported claim token format: ${requiredClaim['claim_token_format']}`);
            }
        }
        return claims;
    }

    // UMA token endpoint discovery
    async getTokenEndpoint(asUri) {
        const resp = await fetch(`${asUri}/.well-known/uma2-configuration`);
        if (!resp.ok) { return undefined; }
        try {
            const uma2 = await resp.json();
            return uma2.token_endpoint;
        } catch {
            return undefined;
        }
    }

    // Token cache helpers
    buildUmaTokenKey(resourceUrl, method = 'GET') { return `${method.toUpperCase()} ${resourceUrl}`; }
    hydrateUmaTokens() {
        try {
            const raw = sessionStorage.getItem('uma_permission_tokens');
            if (!raw) { return; }
            const parsed = JSON.parse(raw);
            const now = Date.now();
            let kept = 0, skipped = 0;
            for (const [key, entry] of Object.entries(parsed)) {
                if (entry && entry.access_token) {
                    if (entry.expires_at && now > entry.expires_at) { skipped++; continue; }
                    this.umaPermissionTokens.set(key, entry); kept++;
                }
            }
            this.persistUmaTokens();
        } catch {
        }
    }
    persistUmaTokens() {
        const obj = {};
        for (const [key, entry] of this.umaPermissionTokens.entries()) obj[key] = entry;
        try { sessionStorage.setItem('uma_permission_tokens', JSON.stringify(obj)); } catch { /* ignore */ }
    }
    getStoredUmaToken(resourceUrl, method='GET') {
        const key = this.buildUmaTokenKey(resourceUrl, method); const entry = this.umaPermissionTokens.get(key);
        if (!entry) return undefined; if (entry.expires_at && Date.now() > entry.expires_at) { this.umaPermissionTokens.delete(key); this.persistUmaTokens(); return undefined; }
        return entry;
    }
    storeUmaToken(resourceUrl, method, token) {
        const key = this.buildUmaTokenKey(resourceUrl, method);
        const expires_at = token.expires_in ? Date.now() + token.expires_in * 1000 : undefined;
        this.umaPermissionTokens.set(key, { token_type: token.token_type, access_token: token.access_token, expires_at });
        this.persistUmaTokens();
    }

    async fetch(input, init) {
        const resourceUrl = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);
        const method = init?.method || 'GET';
        const existingUmaToken = this.getStoredUmaToken(resourceUrl, method);
        let usedCached = false;

        if (existingUmaToken) {
            usedCached = true;
            init = init || {}; init.headers = { ...(init.headers || {}), Authorization: `${existingUmaToken.token_type} ${existingUmaToken.access_token}` };
        }

        let response = await fetch(input, init);
        if (response.status !== 401) {
            if (usedCached) {
                console.info(`retrieved ${resourceUrl} with cached token, status ${response.status}`);
            } else {
                console.info(`retrieved ${resourceUrl} without any tokens, status ${response.status}`);
            }
            return response;
        }

        // If cached token failed, retry without it
        if (usedCached) {
            this.umaPermissionTokens.delete(this.buildUmaTokenKey(resourceUrl, method));
            const retryInit = { ...(init || {}) };
            if (retryInit.headers) { const { Authorization, authorization, ...rest } = retryInit.headers; retryInit.headers = rest; }
            const retryResponse = await fetch(input, retryInit);
            if (retryResponse.status !== 401) {
                console.info(`retrieved ${resourceUrl} without any tokens, status ${retryResponse.status}`);
                return retryResponse;
            }
            response = retryResponse;
        }

        const wwwAuthenticateHeader = response.headers.get('WWW-Authenticate');
        if (!wwwAuthenticateHeader) {
            console.info(`retrieved ${resourceUrl} without any tokens, status ${response.status}`);
            return response;
        }
        const parsed = Object.fromEntries(wwwAuthenticateHeader.replace(/^UMA /, '').split(', ').map(p => p.split('=').map(s => s.replace(/"/g, ''))));
        const { as_uri, ticket } = parsed;
        const tokenEndpoint = await this.getTokenEndpoint(as_uri);
        if (!tokenEndpoint) {
            console.info(`retrieved ${resourceUrl} without any tokens, status ${response.status}`);
            return response;
        }
        const { token, tokenType, expiresIn, error, claimsUsed } = await this.fetchAccessToken(tokenEndpoint, ticket);
        if (error || !token || !tokenType) {
            console.info(`retrieved ${resourceUrl} without any tokens, status ${response.status}`);
            return response;
        }
        this.storeUmaToken(resourceUrl, method, { token_type: tokenType, access_token: token, expires_in: expiresIn });
        const finalInit = init || {}; finalInit.headers = { ...(finalInit.headers || {}), Authorization: `${tokenType} ${token}` };
        const finalResponse = await fetch(input, finalInit);
        console.info(`retrieved ${resourceUrl} with claims, status ${finalResponse.status}`, claimsUsed);
        return finalResponse;
    }

    clearUmaCache() {
        try {
            this.umaPermissionTokens.clear();
            sessionStorage.removeItem('uma_permission_tokens');
        } catch { /* ignore */ }
    }

    clearOidcTokens() {
        try {
            if (this.OidcRefreshTimerId) {
                clearTimeout(this.OidcRefreshTimerId);
                this.OidcRefreshTimerId = undefined;
            }
            this.OidcAccessToken = undefined;
            this.OidcToken = undefined;
            this.OidcRefreshToken = undefined;
            this.OidcTokenExpiry = undefined;
            this.WebId = undefined;
            // Reduced verbosity: no info log
        } catch { /* ignore */ }
        try {
            sessionStorage.removeItem('oidc_state');
            sessionStorage.removeItem('oidc_code_verifier');
            sessionStorage.removeItem('oidc_issuer');
            sessionStorage.removeItem('oidc_client_id');
            sessionStorage.removeItem('oidc_redirect_uri');
        } catch { /* ignore */ }
    }

    clearCache() {
        // Clear both UMA and OIDC related data
        this.clearUmaCache();
        this.clearOidcTokens();
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
}
