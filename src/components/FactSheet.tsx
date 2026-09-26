export function FactSheet({ label, value, mark, cells }: { label: string; value: string; mark?: string; cells: readonly (readonly [string, string])[] }) {
  return (
    <>
      <span className="sheet-top">
        <span>{label}{mark ? <i className="tiny clay">{mark}</i> : null}</span>
        <b>{value}</b>
      </span>
      <span className={cells.length <= 2 ? "sheet-grid rows-1" : "sheet-grid"}>
        {cells.map(([name, fact]) => (
          <span key={name}>
            <span className="tiny">{name}</span>
            <b>{fact}</b>
          </span>
        ))}
      </span>
    </>
  );
}
