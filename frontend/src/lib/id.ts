// Generator id sederhana untuk entitas baru di store in-memory.
let counter = 1000;

export function genId(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter}`;
}
