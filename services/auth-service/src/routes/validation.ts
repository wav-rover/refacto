export function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  return email.includes("@") && email.trim() !== "";
}

export function isValidPassword(password: unknown): password is string {
  if (typeof password !== "string") return false;
  return password.length >= 6;
}

export function isValidBirthDate(birthDate: unknown): birthDate is string {
  if (typeof birthDate !== "string") return false;
  if (birthDate.trim() === "") return false;
  const parsed = Date.parse(birthDate);
  return !Number.isNaN(parsed);
}
