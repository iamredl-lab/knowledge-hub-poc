import { render, screen } from "@testing-library/react";

it("renders into jsdom", () => {
  render(<div data-testid="probe">ok</div>);
  expect(screen.getByTestId("probe")).toHaveTextContent("ok");
});
