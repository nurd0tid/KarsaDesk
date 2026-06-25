import { expect, test } from "@playwright/test";

test("renders the project onboarding shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Bring in your first repository" })).toBeVisible();
  await page.getByRole("button", { name: "Add local project" }).click();
  await expect(page.getByRole("heading", { name: "Add a local project" })).toBeVisible();
  await expect(page.getByText("Repository path")).toBeVisible();
});
