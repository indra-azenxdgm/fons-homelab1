export function startOfDay(date: Date | string) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function endOfDay(date: Date | string) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}
