type PriceProps = {
  value: string;
  className?: string;
};

/** Renders price with a system-font ruble sign so it matches surrounding type. */
export function Price({ value, className }: PriceProps) {
  const hasRuble = /\s*₽\s*$/u.test(value);
  const amount = value.replace(/\s*₽\s*$/u, "").trim();

  return (
    <span className={className}>
      {amount}
      {hasRuble ? (
        <>
          {" "}
          <span className="font-sans">₽</span>
        </>
      ) : null}
    </span>
  );
}
