import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { Public } from "./decorators/public.decorator";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown) {
    const input = loginSchema.parse(body);
    return this.authService.login(input);
  }
}
