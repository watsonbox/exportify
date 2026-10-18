import { http, HttpResponse } from "msw"
import { server } from "./mocks/server"
import { redirectTo } from "./navigation"
import { exchangeCodeForToken, logout } from "./auth"

beforeEach(() => {
  window.history.replaceState(null, "", "/exportify")
})

describe("exchangeCodeForToken", () => {
  test("stores the token and discards the single-use code verifier", async () => {
    server.use(http.post("https://accounts.spotify.com/api/token", () =>
      HttpResponse.json({ access_token: "TEST_ACCESS_TOKEN", token_type: "Bearer", expires_in: 3600 })))
    localStorage.setItem("code_verifier", "TEST_CODE_VERIFIER")

    await expect(exchangeCodeForToken("TEST_AUTH_CODE")).resolves.toBe("TEST_ACCESS_TOKEN")
    expect(localStorage.getItem("access_token")).toBe("TEST_ACCESS_TOKEN")
    expect(localStorage.getItem("code_verifier")).toBeNull()
  })

  test("rejects without storing a token when Spotify refuses the code", async () => {
    server.use(http.post("https://accounts.spotify.com/api/token", () =>
      HttpResponse.json({ error: "invalid_grant", error_description: "Invalid authorization code" }, { status: 400 })))
    localStorage.setItem("code_verifier", "TEST_CODE_VERIFIER")

    await expect(exchangeCodeForToken("EXPIRED_CODE")).rejects.toMatchObject({ response: { status: 400 } })
    expect(localStorage.getItem("access_token")).toBeNull()
  })

  test("rejects before calling Spotify when the code verifier is missing", async () => {
    await expect(exchangeCodeForToken("TEST_AUTH_CODE")).rejects.toThrow("Code verifier not found")
    expect(localStorage.getItem("access_token")).toBeNull()
  })
})

describe("logout", () => {
  test("clears stored credentials and returns to the current page", () => {
    localStorage.setItem("access_token", "TEST_ACCESS_TOKEN")
    localStorage.setItem("code_verifier", "TEST_CODE_VERIFIER")
    localStorage.setItem("client_id", "CUSTOM_CLIENT_ID")

    logout()

    expect(localStorage.length).toBe(0)
    expect(redirectTo).toHaveBeenCalledWith("/exportify")
  })

  test("asks for a fresh permission prompt when changing user", () => {
    logout(true)

    expect(redirectTo).toHaveBeenCalledWith("/exportify?change_user=true")
  })
})
