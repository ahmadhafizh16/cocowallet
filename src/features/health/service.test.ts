import { getHealth } from "./service";

describe("health service", () => {
  it("describes the foundation without claiming wallet features exist", () => {
    expect(getHealth()).toEqual({
      status: "ok",
      service: "simulated-wallet",
      milestone: "foundation",
    });
  });
});
