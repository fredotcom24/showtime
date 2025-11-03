import { Transform } from 'class-transformer';

export function ToArray() {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) return value;
    return [value];
  });
}
