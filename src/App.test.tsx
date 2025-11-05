import React from "react"
import i18n from "i18n/config"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { setupServer } from "msw/node"
import { rest } from "msw"
import { handlers } from "./mocks/handlers"
import App from "./App"
import * as auth from "./auth"

const { location } = window

// Set up MSW server for mocking Spotify API and token exchange
const server = setupServer(...handlers)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' })
  // @ts-ignore
  delete window.location
})

afterAll(() => {
  server.close()
  window.location = location
})

beforeAll(() => {
  // @ts-ignore
  window.location = { hash: "" }
})

beforeEach(() => {
  i18n.changeLanguage("en")
  server.resetHandlers()
})

afterEach(() => {
  localStorage.clear()
})

describe("i18n", () => {
  test("language can be changed to French", async () => {
    render(<App />)

    const linkElement = screen.getByText(/Get Started/i)
    expect(linkElement).toHaveTextContent("Get Started")

    const changeLanguageButton = screen.getByTitle(/Change language/i).getElementsByTagName("button")[0]
    await userEvent.click(changeLanguageButton)

    const frenchLanguageElement = screen.getByText(/Français/i)
    expect(frenchLanguageElement).toBeInTheDocument()

    await userEvent.click(frenchLanguageElement)

    expect(screen.getByText(/Commencer/)).toBeInTheDocument()
    expect(linkElement).toHaveTextContent("Commencer")
  })
})

describe("logging in", () => {
  test("renders get started button and redirects to Spotify with correct scopes", async () => {
    render(<App />)

    const linkElement = screen.getByText(/Get Started/i)

    expect(linkElement).toBeInTheDocument()

    await userEvent.click(linkElement)

    // Now uses PKCE flow with authorization code
    expect(window.location.href).toMatch(/^https:\/\/accounts\.spotify\.com\/authorize\?/)
    expect(window.location.href).toContain('response_type=code')
    expect(window.location.href).toContain('client_id=9950ac751e34487dbbe027c4fd7f8e99')
    expect(window.location.href).toContain('scope=playlist-read-private')
    expect(window.location.href).toContain('code_challenge_method=S256')
    expect(window.location.href).toContain('code_challenge=')
    expect(window.location.href).toContain('show_dialog=false')
  })

  describe("OAuth callback with authorization code", () => {
    let setItemSpy: jest.SpyInstance
    let replaceStateSpy: jest.SpyInstance
    let tokenRequestBody: URLSearchParams | null = null

    beforeEach(() => {
      tokenRequestBody = null

      // Mock localStorage
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
        if (key === 'code_verifier') return 'TEST_CODE_VERIFIER'
        return null
      })
      setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {})
      replaceStateSpy = jest.spyOn(window.history, 'replaceState').mockImplementation(() => {})

      // Mock window.location with code parameter
      // @ts-ignore
      window.location = {
        search: "?code=TEST_AUTH_CODE",
        pathname: "/exportify",
        protocol: "https:",
        host: "exportify.app"
      }

      // Mock Spotify token endpoint and capture request
      server.use(
        rest.post('https://accounts.spotify.com/api/token', async (req, res, ctx) => {
          // Capture the request body for verification
          tokenRequestBody = new URLSearchParams(await req.text())

          return res(ctx.json({
            access_token: 'EXCHANGED_ACCESS_TOKEN',
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: 'REFRESH_TOKEN',
            scope: 'playlist-read-private playlist-read-collaborative user-library-read'
          }))
        })
      )
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    test("exchanges authorization code for access token with correct PKCE parameters", async () => {
      render(<App />)

      // Wait for token exchange to complete
      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith('access_token', 'EXCHANGED_ACCESS_TOKEN')
      })

      // Verify the token endpoint was called with correct parameters
      expect(tokenRequestBody).not.toBeNull()
      expect(tokenRequestBody?.get('client_id')).toBe('9950ac751e34487dbbe027c4fd7f8e99')
      expect(tokenRequestBody?.get('grant_type')).toBe('authorization_code')
      expect(tokenRequestBody?.get('code')).toBe('TEST_AUTH_CODE')
      expect(tokenRequestBody?.get('code_verifier')).toBe('TEST_CODE_VERIFIER')
      expect(tokenRequestBody?.get('redirect_uri')).toBe('https://exportify.app/exportify')

      // Verify code is removed from URL
      expect(replaceStateSpy).toHaveBeenCalledWith({}, expect.any(String), '/exportify')

      // Verify playlist component is rendered
      expect(screen.getByTestId('playlistTableSpinner')).toBeInTheDocument()
    })
  })

  describe("post-login state", () => {
    let getItemSpy: jest.SpyInstance

    beforeEach(() => {
      // Mock localStorage for access token
      getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
        if (key === 'access_token') return 'TEST_ACCESS_TOKEN'
        return null
      })

      // @ts-ignore - No code parameter in URL
      window.location = {
        pathname: "/exportify",
        href: "https://www.example.com/exportify",
        search: "",
        hash: ""
      }
    })

    afterEach(() => {
      getItemSpy.mockRestore()
    })

    test("renders playlist component when access token exists in localStorage", () => {
      render(<App />)

      expect(screen.getByTestId('playlistTableSpinner')).toBeInTheDocument()
    })
  })
})

describe("logging out", () => {
  let getItemSpy: jest.SpyInstance
  let logoutSpy: jest.SpyInstance

  beforeEach(() => {
    // Mock localStorage with access token
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'access_token') return 'TEST_ACCESS_TOKEN'
      return null
    })

    // Spy on logout function
    logoutSpy = jest.spyOn(auth, 'logout').mockImplementation(() => {})

    // @ts-ignore - Simple window.location mock
    window.location = {
      pathname: "/exportify",
      href: "https://www.example.com/exportify",
      search: "",
      hash: ""
    }
  })

  afterEach(() => {
    getItemSpy.mockRestore()
    logoutSpy.mockRestore()
  })

  test("redirects user to login screen which will force a permission request", async () => {
    render(<App />)

    const changeUserElement = screen.getByTitle("Change user")

    expect(changeUserElement).toBeInTheDocument()

    await userEvent.click(changeUserElement)

    expect(logoutSpy).toHaveBeenCalledWith(true)
  })
})
