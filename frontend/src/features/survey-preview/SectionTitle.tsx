// Judul seksi form responden: "A. Petunjuk", "B. Identitas", "C. Pertanyaan Umum".
export function SectionTitle({ letter, title }: { letter: string; title: string }) {
  return (
    <h2 className="text-body-lg font-semibold text-text-primary">
      {letter}. {title}
    </h2>
  );
}
