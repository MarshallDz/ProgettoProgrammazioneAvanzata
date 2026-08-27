import User from "../models/User";
import { Role } from "../types/roles";

/**
 * Public representation of a user returned by the API.
 *
 * The password is intentionally excluded, even though the database stores a
 * hashed value. A password hash is still sensitive authentication data and
 * must not be exposed to clients.
 *
 * `tokenCredit` is exposed as a number. Sequelize commonly returns SQL
 * `DECIMAL` values as strings to preserve precision, so the mapper below
 * explicitly converts the value before creating this DTO.
 */
export type UserResponseDto = {
  id: string;
  username: string;
  role: Role;
  tokenCredit: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Maps a Sequelize User model to the public user response format.
 *
 * This function acts as the boundary between the database model and the API:
 * it selects only safe fields and normalizes the credit value.
 *
 * @param user - Sequelize User instance to convert.
 * @returns A user object without the password and with numeric token credit.
 */
export function toUserResponseDto(user: User): UserResponseDto {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    tokenCredit: Number(user.tokenCredit),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}