import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { JwtAuthGuard } from "./jwt-auth.guard";

function buildContext(): ExecutionContext {
  return {
    getHandler: () => ({}) as never,
    getClass: () => ({}) as never,
    switchToHttp: () => ({
      getRequest: () => ({ headers: {} }),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

describe("JwtAuthGuard", () => {
  let reflector: Reflector;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it("libera handlers marcados com @Public sem invocar passport", () => {
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockImplementation((key) => (key === IS_PUBLIC_KEY ? true : undefined));
    const superSpy = jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), "canActivate")
      .mockReturnValue(false);

    expect(guard.canActivate(buildContext())).toBe(true);
    expect(superSpy).not.toHaveBeenCalled();
  });

  it("delega ao passport quando @Public está ausente", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
    const superSpy = jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), "canActivate")
      .mockReturnValue(true);

    expect(guard.canActivate(buildContext())).toBe(true);
    expect(superSpy).toHaveBeenCalledTimes(1);
  });
});
