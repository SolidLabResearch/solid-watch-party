export function validateAll(field, setField, validations)
{
  for (let i = 0; i < validations.length; ++i) {
    if (!validations[i].run(field.value)) {
      setField({ value: field.value, alertMsg: validations[i].message });
      return false;
    }
  }
  return true;
}

export function validateRequired(string) {
  return string.length > 0;
}

export function validateIsUrl(string) {
  return string.includes('https://') || string.includes('http://');
}

export function validateLength(string, min, max) {
  return string.length >= min && string.length < max;
}
