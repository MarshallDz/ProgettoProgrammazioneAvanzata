import * as z from "zod";

export const authSchema = z.object({
  username: z.string("username is mandatory").min(3, "Username must be at least 3 characters long"),
  password: z.string("password is mandatory").min(6, "Password must be at least 6 characters long"),
});


export const adminSchema = z.object({
  newCredit: z.number("new credit amount is mandatory").nonnegative("new credit must be positive")
});