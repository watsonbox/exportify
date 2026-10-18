// See:
// - https://developer.spotify.com/documentation/web-api/tutorials/migration-implicit-auth-code
// - https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow

import axios from "axios"
import { redirectTo } from "./navigation"

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
  localStorage.removeItem('client_id')
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
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
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
  localStorage.setItem("client_id", clientId)

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
  redirectTo(authUrl.toString())
}

// Thrown when the callback lands in a browser context other than the one that started login
export class MissingCodeVerifierError extends Error {
  constructor() {
    super('Code verifier not found in localStorage')
    this.name = 'MissingCodeVerifierError'
  }
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(code: string): Promise<string> {
  const redirectUri = getRedirectUri()
  const codeVerifier = localStorage.getItem('code_verifier')
  const clientId = localStorage.getItem('client_id') || SPOTIFY_CLIENT_ID

  if (!codeVerifier) {
    throw new MissingCodeVerifierError()
  }

  const response = await axios.post(
    SPOTIFY_TOKEN_URL,
    new URLSearchParams({
      client_id: clientId,
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

  // The verifier is single-use, like the code it was paired with
  saveAccessToken(accessToken)
  localStorage.removeItem('code_verifier')

  return accessToken
}

// Logout and optionally redirect to change user
export function logout(changeUser: boolean = false): void {
  clearAccessToken()
  const url = changeUser
    ? `${window.location.pathname}?change_user=true`
    : window.location.pathname
  redirectTo(url)
}
