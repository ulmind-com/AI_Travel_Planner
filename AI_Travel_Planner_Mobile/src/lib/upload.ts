export interface FilePart {
  uri: string;
  name: string;
  type: string;
}

/** Append a value to FormData only when defined/non-empty. */
export function appendIf(form: FormData, key: string, value: unknown) {
  if (value === undefined || value === null || value === '') return;
  form.append(key, String(value));
}
