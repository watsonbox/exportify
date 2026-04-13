// See:
// - https://developer.spotify.com/documentation/web-api/tutorials/migration-implicit-auth-code
// - https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow

import axios from "axios"

const SPOTIFY_CLIENT_ID = "9950ac751e34487dbbe027c4fd7f8e99"
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
const SPOTIFY_SCOPES = "playlist-read-private playlist-read-collaborative user-library-read"

// Access token management
export function loadAccessToken(): string | null {
  return localStorage.getItem('access_token')
}

export function saveAccessToken(token: string): void {
  localStorage.setItem('access_token', token)
}

export function clearAccessToken(): void {
  localStorage.removeItem('access_token')
  localStorage.removeItem('code_verifier')
}

// Generate code verifier for PKCE flow
function generateCodeVerifier(): string {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const randomValues = crypto.getRandomValues(new Uint8Array(64))
  return Array.from(randomValues)
    .map((value) => possible[value % possible.length])
    .join("")
}

// Generate code challenge from verifier
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const hashed = await crypto.subtle.digest("SHA-256", data)
  return base64urlencode(hashed)
}

// Encode array buffer to base64 URL
function base64urlencode(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer)
  let str = ""
  bytes.forEach((byte) => {
    str += String.fromCharCode(byte)
  })
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

// Get the redirect URI for the current location
function getRedirectUri(): string {
  return [window.location.protocol, '//', window.location.host, window.location.pathname].join('')
}

// Initiate Spotify OAuth authorization flow
export async function initiateSpotifyAuth(options?: { clientId?: string; changeUser?: boolean }): Promise<void> {
  const clientId = options?.clientId || SPOTIFY_CLIENT_ID
  const changeUser = options?.changeUser || false

  // Generate and store PKCE code verifier
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  localStorage.setItem("code_verifier", codeVerifier)

  // Construct authorization URL
  const authUrl = new URL(SPOTIFY_AUTH_URL)
  const params = {
    response_type: "code",
    client_id: clientId,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    redirect_uri: getRedirectUri(),
    show_dialog: changeUser.toString()
  }

  authUrl.search = new URLSearchParams(params).toString()

  // Redirect to Spotify authorization page
  window.location.href = authUrl.toString()
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(code: string): Promise<string> {
  const redirectUri = getRedirectUri()
  const codeVerifier = localStorage.getItem('code_verifier')

  if (!codeVerifier) {
    throw new Error('Code verifier not found in localStorage')
  }

  const response = await axios.post(
    SPOTIFY_TOKEN_URL,
    new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  )

  const accessToken = response.data.access_token

  // Save token and clean up code verifier
  saveAccessToken(accessToken)

  return accessToken
}

// Logout and optionally redirect to change user
export function logout(changeUser: boolean = false): void {
  clearAccessToken()
  const url = changeUser
    ? `${window.location.pathname}?change_user=true`
    : window.location.pathname
  window.location.href = url
}
