export const sourceCoordinates = (value: any) => (globalThis as any).__cheeseburgerCoordinates?.values?.get(value)?.source ?? value;
