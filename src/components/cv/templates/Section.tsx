export interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <section style={{ marginTop: 14 }}>
      <h2
        style={{
          fontSize: "11.5pt",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          borderBottom: "1px solid #222",
          paddingBottom: 4,
          marginBottom: 8,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
