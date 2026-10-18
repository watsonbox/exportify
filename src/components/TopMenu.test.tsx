import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "i18n/config"
import TopMenu from "./TopMenu"

test("help explains the owner filter and links to the documentation", async () => {
  const consoleError = vi.spyOn(console, "error")
  render(<TopMenu loggedIn={true} />)

  await userEvent.click(screen.getByTitle("Help"))
  const help = within(await screen.findByRole("dialog"))

  expect(help.getByText("[owner]", { selector: "code" })).toBeInTheDocument()
  expect(help.getByRole("link", { name: "full project documentation" })).toHaveAttribute("href", "https://github.com/watsonbox/exportify")
  expect(consoleError.mock.calls.filter(([message]) => String(message).includes('unique "key" prop'))).toEqual([])
})
